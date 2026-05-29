package models

import "time"

// Player is a canonical record of a person across all games, keyed by their
// Steam ID. Upserted whenever a demo is analyzed; Name tracks their most recent
// in-game name.
type Player struct {
	SteamID uint64 `gorm:"primarykey"`
	Name    string // latest in-game name seen; refreshed on every analysis
	// CustomName is a user-set override. When non-empty it's shown instead of
	// Name. Kept in its own column so re-analysis (which refreshes Name) never
	// clobbers it.
	CustomName string
	UpdatedAt  time.Time
}

// DisplayName returns the user override when set, otherwise the latest in-game
// name.
func (p Player) DisplayName() string {
	if p.CustomName != "" {
		return p.CustomName
	}
	return p.Name
}

// --- API DTOs (SteamID exposed as a string to avoid JS number precision loss) ---

// PlayerListItem is one row in the players overview, with career totals.
type PlayerListItem struct {
	SteamID string
	Name    string
	Games   int
	Kills   int
	Deaths  int
	Assists int
}

// PlayerGameStat is a player's performance in a single game.
type PlayerGameStat struct {
	DemoID     uint
	GameID     uint
	Map        string
	RecordedAt time.Time
	Team       string
	Kills      int
	Deaths     int
	Assists    int
	ADR        float64

	// Shooting accuracy this match: share of grounded rifle/pistol/SMG shots
	// taken slow enough to be accurate. -1 when the player took no such shots.
	Accuracy float64

	// Flash usage this match. AvgBlindPerFlash (= EnemyFlashSeconds ÷
	// FlashesThrown) is the per-throw blind quality, -1 when no flashes were
	// thrown; EnemyFlashes is the volume (always valid, 0 = flashed nobody).
	EnemyFlashes     int
	AvgBlindPerFlash float64
}

// PlayerProfile is a player's career view: totals plus a per-game breakdown.
type PlayerProfile struct {
	SteamID string
	Name    string
	Games   int
	Kills   int
	Deaths  int
	Assists int
	ADR     float64
	Matches []PlayerGameStat
}
