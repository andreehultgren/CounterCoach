package main

import (
	"context"
	"countercoach/analysis"
	"countercoach/models"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/glebarez/sqlite"
	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// App struct
type App struct {
	ctx          context.Context
	db           *gorm.DB
	analyzeQueue chan uint // demo IDs awaiting background analysis
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
  // 1. Get the OS-specific config directory
	configDir, err := os.UserConfigDir()
	if err != nil {
		fmt.Println("Error getting config dir:", err)
		return
	}
	appDir := filepath.Join(configDir, "MyWailsApp")
	os.MkdirAll(appDir, 0755)

	// 2. Define DB path
	dbPath := filepath.Join(appDir, "database.db")

	// 3. Connect to SQLite using pure-Go GORM driver.
	//    foreign_keys(1)     — enforce FKs so OnDelete:CASCADE works.
	//    journal_mode(WAL)   — allow reads concurrent with the background writer.
	//    busy_timeout(5000)  — wait up to 5s on a locked DB instead of erroring.
	dsn := dbPath + "?_pragma=foreign_keys(1)&_pragma=journal_mode(WAL)&_pragma=busy_timeout(5000)"
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	if err != nil {
		fmt.Println("Failed to connect database:", err)
		return
	}
	// 4. Auto-Migrate your models
	err = db.AutoMigrate(&models.Demo{}, &models.Game{}, &models.PlayerStats{}, &models.Round{}, &models.TeamScore{}, &models.HeatmapPoint{}, &models.UtilityPoint{}, &models.Player{})
	if err != nil {
		fmt.Println("Failed to migrate database:", err)
		return
	}

	// 4b. Drop the legacy demo "name" column — demos are now identified by their
	//     map/result/date. AutoMigrate never removes columns, so do it explicitly
	//     (idempotent: guarded by HasColumn).
	if db.Migrator().HasColumn(&models.Demo{}, "Name") {
		if err := db.Migrator().DropColumn(&models.Demo{}, "Name"); err != nil {
			fmt.Println("Failed to drop legacy demo.name column:", err)
		}
	}

	// 5. Save the DB instance to the App struct
	a.db = db

	// 6. Start the background analysis worker. Demos added via CreateDemo are
	//    enqueued here and parsed sequentially so we don't spike memory/CPU or
	//    contend on the single SQLite writer.
	a.analyzeQueue = make(chan uint, 128)
	go a.analysisWorker()
}

// analysisWorker processes queued demos one at a time, persisting each result
// and emitting a "demo:analyzed" event so the UI can refresh.
func (a *App) analysisWorker() {
	for id := range a.analyzeQueue {
		var demo models.Demo
		if err := a.db.First(&demo, id).Error; err != nil {
			continue
		}
		_, err := a.analyzeDemoRecord(demo)
		if a.ctx != nil {
			errMsg := ""
			if err != nil {
				errMsg = err.Error()
			}
			wailsruntime.EventsEmit(a.ctx, "demo:analyzed", map[string]any{
				"demoID": id,
				"error":  errMsg,
			})
		}
	}
}

// enqueueAnalysis schedules a demo for background analysis without blocking the
// caller (e.g. CreateDemo). If the queue is full it spills to a goroutine.
func (a *App) enqueueAnalysis(id uint) {
	if a.analyzeQueue == nil {
		return
	}
	select {
	case a.analyzeQueue <- id:
	default:
		go func() { a.analyzeQueue <- id }()
	}
}

// SelectDemoFiles opens a native multi-file picker and returns chosen paths
func (a *App) SelectDemoFiles() ([]string, error) {
	return wailsruntime.OpenMultipleFilesDialog(a.ctx, wailsruntime.OpenDialogOptions{
		Title: "Import demos",
	})
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}


// CreateDemo inserts a new demo into the DB and kicks off analysis in the
// background. The demo is returned immediately; the parsed Game lands later and
// the UI is notified via the "demo:analyzed" event. Demos are identified by
// their file path and, once analyzed, by the match's map/result/date.
func (a *App) CreateDemo(path string) (models.Demo, error) {
	demo := models.Demo{Path: path}

	result := a.db.Create(&demo)
	if result.Error != nil {
		return models.Demo{}, result.Error
	}

	a.enqueueAnalysis(demo.ID)

	return demo, nil
}

// recordedFromInfo picks the best available "match date" for a file: its
// creation time (birthtime) when the OS provides it, else its modification time.
func recordedFromInfo(info os.FileInfo) time.Time {
	if bt, ok := fileBirthTime(info); ok {
		return bt
	}
	return info.ModTime()
}

// SetGameRecordedAt overrides the match date for a demo's analysis. unixMillis
// is a Unix-epoch timestamp in milliseconds (matches JS Date.getTime()). The
// override is preserved across future re-analysis.
func (a *App) SetGameRecordedAt(demoID uint, unixMillis int64) error {
	return a.db.Model(&models.Game{}).
		Where("demo_id = ?", demoID).
		Update("recorded_at", time.UnixMilli(unixMillis)).Error
}

// GetDemos fetches all demos from the DB
func (a *App) GetDemos() ([]models.Demo, error) {
	var demos []models.Demo

	// Preload the linked Game (with team scores) so the list can show each
	// demo's map and result without a name.
	result := a.db.Preload("Game").Preload("Game.Teams").Find(&demos)
	if result.Error != nil {
		return nil, result.Error
	}

	// Stat each file so the UI can flag moved/deleted demos.
	for i := range demos {
		_, err := os.Stat(demos[i].Path)
		demos[i].Exists = err == nil
	}

	// Chronological order by match date; demos not yet analyzed fall back to
	// their import time so they still sort sensibly.
	sortKey := func(d models.Demo) time.Time {
		if d.Game != nil && !d.Game.RecordedAt.IsZero() {
			return d.Game.RecordedAt
		}
		return d.CreatedAt
	}
	sort.SliceStable(demos, func(i, j int) bool {
		return sortKey(demos[i]).Before(sortKey(demos[j]))
	})

	return demos, nil
}

// UpdateDemo re-points an existing demo at a new file path (e.g. after the file
// was moved) by its ID.
func (a *App) UpdateDemo(id uint, path string) (models.Demo, error) {
	var demo models.Demo

	// First, find the demo
	if err := a.db.First(&demo, id).Error; err != nil {
		return models.Demo{}, err
	}

	// Update fields (GORM will automatically update the UpdatedAt field)
	demo.Path = path
	if err := a.db.Save(&demo).Error; err != nil {
		return models.Demo{}, err
	}

	// Recompute existence for the returned payload
	_, statErr := os.Stat(demo.Path)
	demo.Exists = statErr == nil

	return demo, nil
}

// DeleteDemo deletes a demo by ID
func (a *App) DeleteDemo(id uint) error {
	result := a.db.Delete(&models.Demo{}, id)
	return result.Error
}

// GetGame returns the stored analysis for a demo, with players ordered from most
// to least kills. Returns nil (no error) when the demo has not been analyzed yet.
func (a *App) GetGame(demoID uint) (*models.Game, error) {
	var game models.Game
	err := a.db.
		Preload("Players", func(db *gorm.DB) *gorm.DB {
			return db.Order("kills DESC, deaths ASC")
		}).
		Preload("Rounds", func(db *gorm.DB) *gorm.DB {
			return db.Order("number ASC")
		}).
		Preload("Teams", func(db *gorm.DB) *gorm.DB {
			return db.Order("score DESC")
		}).
		Preload("Heatmap").
		Preload("Utility").
		Where("demo_id = ?", demoID).
		First(&game).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &game, nil
}

// AnalyzeDemo loads the demo record, parses its file, and persists the result.
// Synchronous: used for user-triggered (re-)analysis. Idempotent.
func (a *App) AnalyzeDemo(id uint) (models.Game, error) {
	var demo models.Demo
	if err := a.db.First(&demo, id).Error; err != nil {
		return models.Game{}, err
	}
	return a.analyzeDemoRecord(demo)
}

// analyzeDemoRecord parses a demo file and persists the result as a Game (with
// per-player stats, rounds and team scores) linked to the demo. It is idempotent:
// a re-analysis replaces any previous Game for the same demo. Panics from the
// parser are recovered into an error so a bad demo can't crash the app.
func (a *App) analyzeDemoRecord(demo models.Demo) (game models.Game, err error) {
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("failed to analyze demo %q: %v", demo.Path, r)
		}
	}()

	game = models.Game{DemoID: demo.ID}

	// File metadata so the UI can flag moved/deleted demos.
	info, statErr := os.Stat(demo.Path)
	if statErr != nil {
		game.FileExists = false
		return game, nil
	}
	game.FileExists = true
	game.FileSize = info.Size()
	game.ModifiedAt = info.ModTime()

	// Match date: preserve a prior value (which may be a user override) across
	// re-analysis; otherwise default to the file's creation time (birthtime).
	var prev models.Game
	if err := a.db.Select("recorded_at").Where("demo_id = ?", demo.ID).First(&prev).Error; err == nil && !prev.RecordedAt.IsZero() {
		game.RecordedAt = prev.RecordedAt
	} else {
		game.RecordedAt = recordedFromInfo(info)
	}

	// Parse the demo file: header metadata + per-player stats.
	parsed := analysis.ParseDemo(demo.Path, false)
	game.Magic = parsed.Magic
	game.Format = parsed.Format
	game.NetworkProtocol = parsed.NetworkProtocol
	game.ServerName = parsed.ServerName
	game.ClientName = parsed.ClientName
	game.MapName = parsed.MapName
	game.GameDirectory = parsed.GameDirectory
	game.PlaybackSeconds = parsed.PlaybackSeconds
	game.Ticks = parsed.Ticks
	game.Frames = parsed.Frames
	for _, p := range parsed.Players {
		game.Players = append(game.Players, models.PlayerStats{
			SteamID: p.SteamID,
			Name:    p.Name,
			Team:    p.Team,
			Kills:   p.Kills,
			Deaths:  p.Deaths,
			Assists: p.Assists,
			Damage:  p.Damage,

			FlashesAcquired:   p.FlashesAcquired,
			FlashesThrown:     p.FlashesThrown,
			FlashRounds:       p.FlashRounds,
			FlashesDiedWith:   p.FlashesDiedWith,
			EnemyFlashes:      p.EnemyFlashes,
			EnemyFlashSeconds: p.EnemyFlashSeconds,
			TeamFlashes:       p.TeamFlashes,
			TeamFlashSeconds:  p.TeamFlashSeconds,

			HEAcquired: p.HEAcquired,
			HEThrown:   p.HEThrown,
			HEDamage:   p.HEDamage,

			MolotovAcquired: p.MolotovAcquired,
			MolotovThrown:   p.MolotovThrown,
			MolotovDamage:   p.MolotovDamage,

			SmokeAcquired: p.SmokeAcquired,
			SmokeThrown:   p.SmokeThrown,

			DecoyAcquired: p.DecoyAcquired,
			DecoyThrown:   p.DecoyThrown,

			RifleAccurate:  p.RifleAccurate,
			RifleRunning:   p.RifleRunning,
			RifleJump:      p.RifleJump,
			PistolAccurate: p.PistolAccurate,
			PistolRunning:  p.PistolRunning,
			PistolJump:     p.PistolJump,
			SMGAccurate:    p.SMGAccurate,
			SMGRunning:     p.SMGRunning,
			SMGJump:        p.SMGJump,
		})
	}
	for _, r := range parsed.Rounds {
		game.Rounds = append(game.Rounds, models.Round{
			Number:     r.Number,
			WinnerSide: r.WinnerSide,
			WinnerClan: r.WinnerClan,
			LoserClan:  r.LoserClan,
			Reason:     r.Reason,
		})
	}
	for _, t := range parsed.Teams {
		game.Teams = append(game.Teams, models.TeamScore{
			Name:  t.Name,
			Score: t.Score,
		})
	}
	for _, h := range parsed.Heatmap {
		game.Heatmap = append(game.Heatmap, models.HeatmapPoint{
			X:       h.X,
			Y:       h.Y,
			Kind:    h.Kind,
			SteamID: h.SteamID,
		})
	}
	for _, u := range parsed.Utility {
		game.Utility = append(game.Utility, models.UtilityPoint{
			X:       u.X,
			Y:       u.Y,
			Kind:    u.Kind,
			SteamID: u.SteamID,
		})
	}

	// Canonical player registry: upsert each (non-bot) player so they can be
	// inspected across games. Keyed by Steam ID; Name tracks the latest seen.
	var registry []models.Player
	for _, p := range parsed.Players {
		if p.SteamID == 0 {
			continue
		}
		registry = append(registry, models.Player{SteamID: p.SteamID, Name: p.Name})
	}

	// Persist atomically: drop any prior analysis for this demo (cascade removes
	// its PlayerStats), insert the fresh Game + children, and upsert players.
	err = a.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("demo_id = ?", demo.ID).Delete(&models.Game{}).Error; err != nil {
			return err
		}
		if err := tx.Create(&game).Error; err != nil {
			return err
		}
		if len(registry) > 0 {
			if err := tx.Clauses(clause.OnConflict{
				Columns:   []clause.Column{{Name: "steam_id"}},
				DoUpdates: clause.AssignmentColumns([]string{"name", "updated_at"}),
			}).Create(&registry).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return models.Game{}, err
	}

	return game, nil
}

// SetPlayerName sets (or clears) a user override for a player's display name,
// keyed by Steam ID. An empty/blank name clears the override, reverting to the
// latest in-game name. The override is stored separately from the parsed name
// so re-analysis never overwrites it. steamID is a decimal string.
func (a *App) SetPlayerName(steamID string, name string) error {
	id, err := strconv.ParseUint(steamID, 10, 64)
	if err != nil {
		return fmt.Errorf("invalid steam id %q: %w", steamID, err)
	}
	// Upsert: set only custom_name, leaving the parsed Name intact. Handles the
	// (unlikely) case where the player isn't in the registry yet.
	return a.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "steam_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"custom_name"}),
	}).Create(&models.Player{SteamID: id, CustomName: strings.TrimSpace(name)}).Error
}

// GetPlayers returns every known player with their career totals, ordered by
// total kills (most prolific first).
func (a *App) GetPlayers() ([]models.PlayerListItem, error) {
	type agg struct {
		SteamID uint64
		Games   int
		Kills   int
		Deaths  int
		Assists int
	}
	var aggs []agg
	err := a.db.Model(&models.PlayerStats{}).
		Select("steam_id, COUNT(*) AS games, SUM(kills) AS kills, SUM(deaths) AS deaths, SUM(assists) AS assists").
		Where("steam_id <> 0").
		Group("steam_id").
		Order("kills DESC").
		Scan(&aggs).Error
	if err != nil {
		return nil, err
	}

	// Canonical names from the player registry.
	var players []models.Player
	if err := a.db.Find(&players).Error; err != nil {
		return nil, err
	}
	names := make(map[uint64]string, len(players))
	for _, p := range players {
		names[p.SteamID] = p.DisplayName()
	}

	// Hide one-off players (only appear in a single game) so a large library
	// isn't cluttered with opponents seen once. Skip this filter when there's
	// only one game in total — otherwise the list would be empty.
	var totalGames int64
	if err := a.db.Model(&models.Game{}).Count(&totalGames).Error; err != nil {
		return nil, err
	}
	hideSingles := totalGames > 1

	out := make([]models.PlayerListItem, 0, len(aggs))
	for _, a := range aggs {
		if hideSingles && a.Games < 2 {
			continue
		}
		out = append(out, models.PlayerListItem{
			SteamID: strconv.FormatUint(a.SteamID, 10),
			Name:    names[a.SteamID],
			Games:   a.Games,
			Kills:   a.Kills,
			Deaths:  a.Deaths,
			Assists: a.Assists,
		})
	}
	return out, nil
}

// GetPlayerProfile returns a player's career totals and a per-game breakdown,
// ordered chronologically. steamID is a decimal string (uint64 won't survive a
// JS number round-trip).
func (a *App) GetPlayerProfile(steamID string) (models.PlayerProfile, error) {
	id, err := strconv.ParseUint(steamID, 10, 64)
	if err != nil {
		return models.PlayerProfile{}, fmt.Errorf("invalid steam id %q: %w", steamID, err)
	}

	var player models.Player
	_ = a.db.First(&player, id).Error // name only; absence is non-fatal

	type row struct {
		DemoID     uint
		GameID     uint
		MapName    string
		RecordedAt time.Time
		Team       string
		Kills      int
		Deaths     int
		Assists    int
		Damage     int
		Rounds     int

		AccurateShots     int
		RunningShots      int
		FlashesThrown     int
		EnemyFlashes      int
		EnemyFlashSeconds float64
	}
	var rows []row
	err = a.db.Raw(`
		SELECT g.demo_id AS demo_id, g.id AS game_id, g.map_name AS map_name,
		       g.recorded_at AS recorded_at, ps.team AS team,
		       ps.kills AS kills, ps.deaths AS deaths, ps.assists AS assists, ps.damage AS damage,
		       (ps.rifle_accurate + ps.pistol_accurate + ps.smg_accurate) AS accurate_shots,
		       (ps.rifle_running + ps.pistol_running + ps.smg_running) AS running_shots,
		       ps.flashes_thrown AS flashes_thrown,
		       ps.enemy_flashes AS enemy_flashes,
		       ps.enemy_flash_seconds AS enemy_flash_seconds,
		       (SELECT COUNT(*) FROM rounds r WHERE r.game_id = g.id) AS rounds
		FROM player_stats ps
		JOIN games g ON g.id = ps.game_id
		WHERE ps.steam_id = ?
		ORDER BY g.recorded_at ASC, g.id ASC
	`, id).Scan(&rows).Error
	if err != nil {
		return models.PlayerProfile{}, err
	}

	profile := models.PlayerProfile{
		SteamID: steamID,
		Name:    player.DisplayName(),
		Matches: make([]models.PlayerGameStat, 0, len(rows)),
	}
	totalDamage, totalRounds := 0, 0
	for _, r := range rows {
		adr := 0.0
		if r.Rounds > 0 {
			adr = float64(r.Damage) / float64(r.Rounds)
		}
		accuracy := -1.0 // sentinel: no measured shots this match
		if shots := r.AccurateShots + r.RunningShots; shots > 0 {
			accuracy = 100 * float64(r.AccurateShots) / float64(shots)
		}
		avgBlind := -1.0 // sentinel: threw no flashes this match
		if r.FlashesThrown > 0 {
			avgBlind = r.EnemyFlashSeconds / float64(r.FlashesThrown)
		}
		profile.Matches = append(profile.Matches, models.PlayerGameStat{
			DemoID:           r.DemoID,
			GameID:           r.GameID,
			Map:              r.MapName,
			RecordedAt:       r.RecordedAt,
			Team:             r.Team,
			Kills:            r.Kills,
			Deaths:           r.Deaths,
			Assists:          r.Assists,
			ADR:              adr,
			Accuracy:         accuracy,
			EnemyFlashes:     r.EnemyFlashes,
			AvgBlindPerFlash: avgBlind,
		})
		profile.Games++
		profile.Kills += r.Kills
		profile.Deaths += r.Deaths
		profile.Assists += r.Assists
		totalDamage += r.Damage
		totalRounds += r.Rounds
	}
	if totalRounds > 0 {
		profile.ADR = float64(totalDamage) / float64(totalRounds)
	}
	if profile.Name == "" && len(rows) > 0 {
		// Fall back to a per-game name if the registry has none.
		var n string
		_ = a.db.Model(&models.PlayerStats{}).Select("name").Where("steam_id = ?", id).Limit(1).Scan(&n).Error
		profile.Name = n
	}
	return profile, nil
}
