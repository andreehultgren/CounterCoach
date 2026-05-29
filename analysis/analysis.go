package analysis

import (
	"fmt"
	"log"
	"math"
	"os"

	ex "github.com/markus-wa/demoinfocs-golang/v5/examples"
	demoinfocs "github.com/markus-wa/demoinfocs-golang/v5/pkg/demoinfocs"
	common "github.com/markus-wa/demoinfocs-golang/v5/pkg/demoinfocs/common"
	events "github.com/markus-wa/demoinfocs-golang/v5/pkg/demoinfocs/events"
	msg "github.com/markus-wa/demoinfocs-golang/v5/pkg/demoinfocs/msg"

	_ "image/png" // register PNG decoder for radar images
)


// accurateSpeedFraction is the share of a weapon's max move speed below which a
// moving shot is still considered accurate. CS2 applies negligible movement
// inaccuracy below ~25-34% of max speed; 0.34 is the commonly-cited "still
// accurate while moving" figure. Shots above this (and on the ground) are
// "running" shots.
const accurateSpeedFraction = 0.34

// weaponMaxSpeed holds each gun's documented CS2 maximum movement speed (units
// per second) while held. Only guns we measure are listed — pistols, SMGs and
// rifles/snipers. A weapon absent from this map is not counted at all, which is
// how shotguns, LMGs, knives, grenades and equipment are excluded.
var weaponMaxSpeed = map[common.EquipmentType]float64{
	// Pistols
	common.EqGlock:        240,
	common.EqUSP:          240,
	common.EqP2000:        240,
	common.EqP250:         240,
	common.EqFiveSeven:    240,
	common.EqTec9:         240,
	common.EqCZ:           240,
	common.EqDualBerettas: 240,
	common.EqDeagle:       230,
	common.EqRevolver:     220,
	// SMGs
	common.EqMP9:   240,
	common.EqMac10: 240,
	common.EqMP7:   220,
	common.EqMP5:   235,
	common.EqUMP:   230,
	common.EqP90:   230,
	common.EqBizon: 240,
	// Rifles
	common.EqGalil: 215,
	common.EqFamas: 220,
	common.EqAK47:  215,
	common.EqM4A4:  225,
	common.EqM4A1:  225,
	common.EqSG553: 210,
	common.EqAUG:   220,
	// Snipers (rifle class)
	common.EqScout:  230, // SSG 08
	common.EqAWP:    200,
	common.EqScar20: 215,
	common.EqG3SG1:  215,
}

type PlayerStats struct {
	SteamID uint64
	Name string
	Team string // clan/team name the player belongs to
	Kills int
	Deaths int
	Assists int
	Damage int // total health damage dealt to enemies (for ADR)

	// Flash utility (per match) — focused on whether utility actually gets used.
	FlashesAcquired   int     // flashbangs obtained (bought or picked up)
	FlashesThrown     int     // flashbangs thrown
	FlashRounds       int     // rounds in which the player threw at least one flash
	FlashesDiedWith   int     // flashbangs still held when killed (utility wasted)
	EnemyFlashes      int     // number of enemy blind effects caused
	EnemyFlashSeconds float64 // total enemy blind time caused
	TeamFlashes       int     // number of teammate blind effects caused (bad)
	TeamFlashSeconds  float64 // total teammate blind time caused

	// HE grenades.
	HEAcquired int
	HEThrown   int
	HEDamage   int // health damage dealt to enemies by HE grenades

	// Molotov / Incendiary (fire) — counted together.
	MolotovAcquired int
	MolotovThrown   int
	MolotovDamage   int // health damage dealt to enemies by fire

	// Smoke.
	SmokeAcquired int
	SmokeThrown   int

	// Decoy.
	DecoyAcquired int
	DecoyThrown   int

	// Shooting-while-moving accuracy. Each bullet fired (WeaponFire) with a
	// gun in the tracked set (pistols/SMGs/rifles incl. snipers) is bucketed by
	// the shooter's horizontal speed at that tick vs the weapon's max move speed:
	//   - Jump: fired while airborne (excluded from the accurate/running ratio).
	//   - Accurate: on the ground and speed <= 34% of the weapon's max speed.
	//   - Running: on the ground and faster than that.
	// Counts are split by weapon class so the UI can show an overall figure plus
	// a per-class breakdown. Heavy/knife/grenades/equipment are not counted.
	RifleAccurate  int
	RifleRunning   int
	RifleJump      int
	PistolAccurate int
	PistolRunning  int
	PistolJump     int
	SMGAccurate    int
	SMGRunning     int
	SMGJump        int
}

// RoundResult is the outcome of a single round.
type RoundResult struct {
	Number     int    // 1-based round number within the match
	WinnerSide string // "T" or "CT" — the side the winning team played this round
	WinnerClan string // clan/team name of the winners
	LoserClan  string // clan/team name of the losers
	Reason     string // how the round ended (e.g. "Bomb defused", "Elimination")
}

// TeamResult is a team's total rounds won across the whole match (both halves).
type TeamResult struct {
	Name  string
	Score int
}

// HeatmapPoint is a single kill/death location, normalized to 0..1 over the
// radar overview image so the frontend can scale it to any display size.
type HeatmapPoint struct {
	X       float64
	Y       float64
	Kind    string // "kill" (shooter position) or "death" (victim position)
	SteamID uint64 // the player this point belongs to (shooter for kill, victim for death)
}

// UtilityPoint is where a grenade detonated/landed ("popped"), normalized to
// 0..1 over the radar overview image and attributed to the thrower. Captured
// from GrenadeProjectileDestroy (last trajectory point) so molotovs get a
// thrower on CS2 demos, unlike the FireGrenadeStart/InfernoStart events.
type UtilityPoint struct {
	X       float64
	Y       float64
	Kind    string // "flash" | "he" | "molotov" | "smoke" | "decoy"
	SteamID uint64 // the thrower
}

type GameStats struct{
	// Header metadata (Source 2 / CS2 demos).
	Magic           string
	Format          string
	NetworkProtocol int32
	ServerName      string
	ClientName      string
	MapName         string
	GameDirectory   string
	PlaybackSeconds float32
	Ticks           int32
	Frames          int32

	Players map[uint64]PlayerStats
	Rounds  []RoundResult
	Teams   []TeamResult
	Heatmap []HeatmapPoint
	Utility []UtilityPoint
}

// roundEndReasonString maps a demoinfocs RoundEndReason to a short label.
func roundEndReasonString(r events.RoundEndReason) string {
	switch r {
	case events.RoundEndReasonTargetBombed:
		return "Bomb detonated"
	case events.RoundEndReasonBombDefused:
		return "Bomb defused"
	case events.RoundEndReasonCTWin:
		return "CT elimination"
	case events.RoundEndReasonTerroristsWin:
		return "T elimination"
	case events.RoundEndReasonTargetSaved:
		return "Time expired"
	case events.RoundEndReasonHostagesRescued:
		return "Hostages rescued"
	case events.RoundEndReasonHostagesNotRescued:
		return "Hostages not rescued"
	case events.RoundEndReasonTerroristsSurrender:
		return "T surrender"
	case events.RoundEndReasonCTSurrender:
		return "CT surrender"
	default:
		return "Round won"
	}
}

// aggregateTeams counts rounds won per team (by clan name) and returns them in
// first-appearance order. Both teams are included even if one won zero rounds.
func aggregateTeams(rounds []RoundResult) []TeamResult {
	wins := map[string]int{}
	seen := map[string]bool{}
	order := []string{}
	see := func(name string) {
		if name == "" || seen[name] {
			return
		}
		seen[name] = true
		order = append(order, name)
	}
	for _, r := range rounds {
		see(r.WinnerClan)
		see(r.LoserClan)
		if r.WinnerClan != "" {
			wins[r.WinnerClan]++
		}
	}
	teams := make([]TeamResult, 0, len(order))
	for _, name := range order {
		teams = append(teams, TeamResult{Name: name, Score: wins[name]})
	}
	return teams
}


// killPos holds the raw in-game world coordinates of a kill, captured during
// parsing and translated to radar pixels once the map is known.
type killPos struct {
	killerX, killerY float64
	killerID         uint64
	hasKiller        bool
	victimX, victimY float64
	victimID         uint64
}

// buildHeatmap translates raw kill positions into normalized (0..1) radar
// coordinates using the embedded map metadata. Returns nil if the map has no
// metadata/radar (recovering from the panics those helpers raise).
func buildHeatmap(mapName string, kills []killPos) (points []HeatmapPoint) {
	if mapName == "" || len(kills) == 0 {
		return nil
	}
	defer func() {
		if r := recover(); r != nil {
			points = nil // map not in the embedded asset set — skip silently
		}
	}()

	meta := ex.GetMapMetadata(mapName)
	radar := ex.GetMapRadar(mapName)
	w := float64(radar.Bounds().Dx())
	h := float64(radar.Bounds().Dy())
	if w == 0 || h == 0 {
		return nil
	}

	for _, k := range kills {
		vx, vy := meta.TranslateScale(k.victimX, k.victimY)
		points = append(points, HeatmapPoint{X: vx / w, Y: vy / h, Kind: "death", SteamID: k.victimID})
		if k.hasKiller {
			kx, ky := meta.TranslateScale(k.killerX, k.killerY)
			points = append(points, HeatmapPoint{X: kx / w, Y: ky / h, Kind: "kill", SteamID: k.killerID})
		}
	}
	return points
}

// nadePop is the raw world position where a grenade detonated/landed, captured
// during parsing and translated to radar pixels once the map is known.
type nadePop struct {
	x, y    float64
	kind    string
	throwID uint64
}

// utilKindOf maps a grenade equipment type to a heatmap kind label, or "" for
// types we don't track on the utility heatmap.
func utilKindOf(t common.EquipmentType) string {
	switch t {
	case common.EqFlash:
		return "flash"
	case common.EqHE:
		return "he"
	case common.EqMolotov, common.EqIncendiary:
		return "molotov"
	case common.EqSmoke:
		return "smoke"
	case common.EqDecoy:
		return "decoy"
	default:
		return ""
	}
}

// buildUtility translates raw grenade-pop positions into normalized (0..1)
// radar coordinates. Mirrors buildHeatmap's map-metadata handling.
func buildUtility(mapName string, pops []nadePop) (points []UtilityPoint) {
	if mapName == "" || len(pops) == 0 {
		return nil
	}
	defer func() {
		if r := recover(); r != nil {
			points = nil
		}
	}()

	meta := ex.GetMapMetadata(mapName)
	radar := ex.GetMapRadar(mapName)
	w := float64(radar.Bounds().Dx())
	h := float64(radar.Bounds().Dy())
	if w == 0 || h == 0 {
		return nil
	}

	for _, n := range pops {
		x, y := meta.TranslateScale(n.x, n.y)
		points = append(points, UtilityPoint{X: x / w, Y: y / h, Kind: n.kind, SteamID: n.throwID})
	}
	return points
}

func ParseDemo(demoPath string, verbose bool ) GameStats{
	game := GameStats{Players: map[uint64]PlayerStats{}}
	stats := game.Players
	var killPositions []killPos
	var nadePops []nadePop              // grenade detonation/landing positions, per throw
	flashThisRound := map[uint64]bool{} // steamIDs that have thrown a flash this round

	// Per-player horizontal speed, derived from position deltas each frame. CS2
	// demos don't network player velocity (m_vecVelocity is absent on the pawn),
	// so we differentiate Position() over time. Reset each round to avoid a
	// spurious spike across the freezetime teleport.
	type posSnap struct {
		x, y, t float64
		ok      bool
	}
	lastPos := map[uint64]posSnap{}
	curSpeed := map[uint64]float64{}

	touch := func(p *common.Player) *PlayerStats {
		if p == nil {
			return nil
		}
		s, ok := stats[p.SteamID64]
		if !ok {
			s = PlayerStats{SteamID: p.SteamID64, Name: p.Name}
		}
		// Team (clan) name is stable across the halftime side-swap. Capture it once
		// it becomes available — it may be empty on the very first events.
		if s.Team == "" && p.TeamState != nil {
			s.Team = p.TeamState.ClanName()
		}
		stats[p.SteamID64] = s
		return &s
	}

	f, err := os.Open(demoPath)
	if err != nil {
		log.Panic("failed to open demo: ", err)
	}
	defer f.Close()

	p := demoinfocs.NewParser(f)
	defer p.Close()

	// Header metadata: emitted near the start of the demo.
	p.RegisterNetMessageHandler(func(m *msg.CDemoFileHeader) {
		game.Magic = m.GetDemoFileStamp()
		game.Format = m.GetDemoVersionName()
		game.NetworkProtocol = m.GetPatchVersion()
		game.ServerName = m.GetServerName()
		game.ClientName = m.GetClientName()
		game.MapName = m.GetMapName()
		game.GameDirectory = m.GetGameDirectory()
	})
	// Playback totals: present in CDemoFileInfo at the end of the demo (when the
	// demo contains it). GOTV demos often omit it — handled by the fallback below.
	p.RegisterNetMessageHandler(func(m *msg.CDemoFileInfo) {
		game.PlaybackSeconds = m.GetPlaybackTime()
		game.Ticks = m.GetPlaybackTicks()
		game.Frames = m.GetPlaybackFrames()
	})

	p.RegisterEventHandler(
		func(kill events.Kill) {
			if s := touch(kill.Killer); s != nil {
				s.Kills++
				stats[kill.Killer.SteamID64] = *s
			}
			if s := touch(kill.Victim); s != nil {
				s.Deaths++
				// Utility wasted: flashes still in hand at death (match rounds only).
				if !p.GameState().IsWarmupPeriod() {
					for _, eq := range kill.Victim.Inventory {
						if eq.Type == common.EqFlash {
							s.FlashesDiedWith++
						}
					}
				}
				stats[kill.Victim.SteamID64] = *s
			}
			if s := touch(kill.Assister); s != nil {
				s.Assists++
				stats[kill.Assister.SteamID64] = *s
			}

			// Capture positions for the heatmap (match rounds only).
			if !p.GameState().IsWarmupPeriod() && kill.Victim != nil {
				kp := killPos{}
				vp := kill.Victim.Position()
				kp.victimX, kp.victimY, kp.victimID = vp.X, vp.Y, kill.Victim.SteamID64
				if kill.Killer != nil {
					kpos := kill.Killer.Position()
					kp.killerX, kp.killerY = kpos.X, kpos.Y
					kp.killerID, kp.hasKiller = kill.Killer.SteamID64, true
				}
				killPositions = append(killPositions, kp)
			}
		})

	// Damage dealt to enemies, for ADR. Excludes warmup, self- and team-damage.
	p.RegisterEventHandler(func(e events.PlayerHurt) {
		if p.GameState().IsWarmupPeriod() {
			return
		}
		if e.Attacker == nil || e.Player == nil {
			return
		}
		if e.Attacker.SteamID64 == e.Player.SteamID64 {
			return
		}
		if e.Attacker.Team == e.Player.Team && e.Attacker.Team != common.TeamUnassigned {
			return
		}
		if s := touch(e.Attacker); s != nil {
			s.Damage += e.HealthDamageTaken
			if e.Weapon != nil {
				switch e.Weapon.Type {
				case common.EqHE:
					s.HEDamage += e.HealthDamageTaken
				case common.EqMolotov, common.EqIncendiary:
					s.MolotovDamage += e.HealthDamageTaken
				}
			}
			stats[e.Attacker.SteamID64] = *s
		}
	})

	// Grenade throws, by type. The denominator-vs-usage pair is acquisitions
	// (ItemPickup) and throws (GrenadeProjectileThrow).
	p.RegisterEventHandler(func(e events.GrenadeProjectileThrow) {
		if p.GameState().IsWarmupPeriod() {
			return
		}
		proj := e.Projectile
		if proj == nil || proj.WeaponInstance == nil || proj.Thrower == nil {
			return
		}
		s := touch(proj.Thrower)
		if s == nil {
			return
		}
		switch proj.WeaponInstance.Type {
		case common.EqFlash:
			s.FlashesThrown++
			if !flashThisRound[proj.Thrower.SteamID64] {
				s.FlashRounds++
				flashThisRound[proj.Thrower.SteamID64] = true
			}
		case common.EqHE:
			s.HEThrown++
		case common.EqMolotov, common.EqIncendiary:
			s.MolotovThrown++
		case common.EqSmoke:
			s.SmokeThrown++
		case common.EqDecoy:
			s.DecoyThrown++
		}
		stats[proj.Thrower.SteamID64] = *s
	})

	// Grenade pop positions for the utility heatmap. Fires on detonation/expiry;
	// the projectile keeps its Thrower (unlike FireGrenadeStart/InfernoStart on
	// CS2), so molotovs are attributable too. Last trajectory point ≈ where it
	// popped/landed.
	p.RegisterEventHandler(func(e events.GrenadeProjectileDestroy) {
		if p.GameState().IsWarmupPeriod() {
			return
		}
		proj := e.Projectile
		if proj == nil || proj.WeaponInstance == nil || proj.Thrower == nil || len(proj.Trajectory) == 0 {
			return
		}
		kind := utilKindOf(proj.WeaponInstance.Type)
		if kind == "" {
			return
		}
		last := proj.Trajectory[len(proj.Trajectory)-1].Position
		nadePops = append(nadePops, nadePop{
			x:       last.X,
			y:       last.Y,
			kind:    kind,
			throwID: proj.Thrower.SteamID64,
		})
	})

	// Reset per-round trackers at the start of each round. Clearing lastPos stops
	// the freezetime respawn teleport from registering as a huge velocity.
	p.RegisterEventHandler(func(events.RoundStart) {
		flashThisRound = map[uint64]bool{}
		lastPos = map[uint64]posSnap{}
		curSpeed = map[uint64]float64{}
	})

	// Per-frame velocity derivation: track each living player's horizontal speed
	// as the distance moved since the previous frame over the elapsed time.
	p.RegisterEventHandler(func(events.FrameDone) {
		t := p.CurrentTime().Seconds()
		for _, pl := range p.GameState().Participants().Playing() {
			if pl == nil || !pl.IsAlive() {
				continue
			}
			pos := pl.Position()
			if s, ok := lastPos[pl.SteamID64]; ok && s.ok {
				if dt := t - s.t; dt > 0 {
					curSpeed[pl.SteamID64] = math.Hypot(pos.X-s.x, pos.Y-s.y) / dt
				}
			}
			lastPos[pl.SteamID64] = posSnap{pos.X, pos.Y, t, true}
		}
	})

	// Shooting-while-moving accuracy. One event per bullet. We classify the shot
	// by the shooter's speed (derived above) vs the weapon's max move speed.
	p.RegisterEventHandler(func(e events.WeaponFire) {
		if p.GameState().IsWarmupPeriod() || e.Shooter == nil || e.Weapon == nil {
			return
		}
		maxSpeed, tracked := weaponMaxSpeed[e.Weapon.Type]
		if !tracked {
			return // shotgun/LMG/knife/grenade/equipment — not measured
		}
		s := touch(e.Shooter)
		if s == nil {
			return
		}

		// Bucket: jump (airborne) takes precedence; otherwise accurate vs running
		// by the speed fraction.
		airborne := e.Shooter.IsAirborne()
		running := !airborne && curSpeed[e.Shooter.SteamID64] > maxSpeed*accurateSpeedFraction

		switch e.Weapon.Class() {
		case common.EqClassPistols:
			switch {
			case airborne:
				s.PistolJump++
			case running:
				s.PistolRunning++
			default:
				s.PistolAccurate++
			}
		case common.EqClassSMG:
			switch {
			case airborne:
				s.SMGJump++
			case running:
				s.SMGRunning++
			default:
				s.SMGAccurate++
			}
		case common.EqClassRifle:
			switch {
			case airborne:
				s.RifleJump++
			case running:
				s.RifleRunning++
			default:
				s.RifleAccurate++
			}
		}
		stats[e.Shooter.SteamID64] = *s
	})

	// Grenade acquisitions (buys + ground pickups), by type. A player may hold 2
	// and pick up more mid-round, so this is the true usage denominator.
	p.RegisterEventHandler(func(e events.ItemPickup) {
		if p.GameState().IsWarmupPeriod() || e.Weapon == nil {
			return
		}
		s := touch(e.Player)
		if s == nil {
			return
		}
		switch e.Weapon.Type {
		case common.EqFlash:
			s.FlashesAcquired++
		case common.EqHE:
			s.HEAcquired++
		case common.EqMolotov, common.EqIncendiary:
			s.MolotovAcquired++
		case common.EqSmoke:
			s.SmokeAcquired++
		case common.EqDecoy:
			s.DecoyAcquired++
		default:
			return
		}
		stats[e.Player.SteamID64] = *s
	})

	// Flash utility: blind effects, attributed to the flasher. One event fires
	// per blinded player, so multi-flashes accumulate naturally.
	p.RegisterEventHandler(func(e events.PlayerFlashed) {
		if p.GameState().IsWarmupPeriod() {
			return
		}
		if e.Attacker == nil || e.Player == nil || e.Attacker.SteamID64 == e.Player.SteamID64 {
			return
		}
		dur := e.FlashDuration().Seconds()
		if dur <= 0 {
			return
		}
		s := touch(e.Attacker)
		if s == nil {
			return
		}
		sameTeam := e.Attacker.Team == e.Player.Team && e.Attacker.Team != common.TeamUnassigned
		if sameTeam {
			s.TeamFlashes++
			s.TeamFlashSeconds += dur
		} else {
			s.EnemyFlashes++
			s.EnemyFlashSeconds += dur
		}
		stats[e.Attacker.SteamID64] = *s
	})

	// Round-by-round results. Skip warmup / knife rounds (not part of the match)
	// and draws (no winning side).
	p.RegisterEventHandler(func(e events.RoundEnd) {
		gs := p.GameState()
		if gs.IsWarmupPeriod() || !gs.IsMatchStarted() {
			return
		}
		if e.WinnerState == nil || (e.Winner != common.TeamTerrorists && e.Winner != common.TeamCounterTerrorists) {
			return
		}

		side := "CT"
		if e.Winner == common.TeamTerrorists {
			side = "T"
		}
		loserClan := ""
		if e.LoserState != nil {
			loserClan = e.LoserState.ClanName()
		}

		game.Rounds = append(game.Rounds, RoundResult{
			Number:     len(game.Rounds) + 1,
			WinnerSide: side,
			WinnerClan: e.WinnerState.ClanName(),
			LoserClan:  loserClan,
			Reason:     roundEndReasonString(e.Reason),
		})
	})

	if err := p.ParseToEnd(); err != nil {
		log.Panic("failed to parse demo: ", err)
	}

	// Aggregate per-team totals from the rounds. Keyed by clan name so the totals
	// are correct across the halftime side-swap. Insertion order preserved so the
	// team that first appears is listed first.
	game.Teams = aggregateTeams(game.Rounds)

	// Build the kill/death heatmap by translating world coordinates to normalized
	// radar coordinates. Guarded: a map without embedded metadata just yields no
	// heatmap rather than failing the whole analysis.
	game.Heatmap = buildHeatmap(game.MapName, killPositions)
	game.Utility = buildUtility(game.MapName, nadePops)

	// Fallback when the demo lacks CDemoFileInfo: derive playback totals from the
	// parser's final state (mirrors demoinfocs' own ensurePlaybackValuesAreSet).
	if game.Ticks == 0 {
		game.PlaybackSeconds = float32(p.CurrentTime().Seconds())
		game.Frames = int32(p.CurrentFrame())
		if tr := p.TickRate(); tr > 0 {
			game.Ticks = int32(p.CurrentTime().Seconds() * tr)
		}
	}

	if verbose{
		maxNameLen := 1
		for _, stat := range stats{
			maxNameLen = max(len(stat.Name), maxNameLen)
		}
		for _, stat := range stats {
			fmt.Printf("%-*s | Kills: %3d | Deaths: %3d | Assists: %3d\n", maxNameLen, stat.Name, stat.Kills, stat.Deaths, stat.Assists)
		}
	}

	return game
}
