package models

import "time"

// AnalysisResult is the end-to-end payload returned to the frontend after
// analysing a demo file on the Go backend.
type Game struct {
	ID         uint `gorm:"primarykey"`

	// The demo file this analysis was produced from.
	DemoID uint `gorm:"index" json:"DemoID"`

	FileExists bool      `json:"FileExists"`
	FileSize   int64     `json:"FileSize"`
	ModifiedAt time.Time `json:"ModifiedAt"`

	// RecordedAt is when the match took place. CS2 demos don't store this, so it
	// defaults to the file's creation time (birthtime) and can be overridden by
	// the user. Preserved across re-analysis.
	RecordedAt time.Time `json:"RecordedAt"`

	// Format detected from the file's magic header.
	Format string `json:"Format"`
	Magic  string `json:"Magic"`

	// Parsed from the Source 1 (.dem) header when available.
	DemoProtocol    int32   `json:"DemoProtocol"`
	NetworkProtocol int32   `json:"NetworkProtocol"`
	ServerName      string  `json:"ServerName"`
	ClientName      string  `json:"ClientName"`
	MapName         string  `json:"MapName"`
	GameDirectory   string  `json:"GameDirectory"`
	PlaybackSeconds float32 `json:"PlaybackSeconds"`
	Ticks           int32   `json:"Ticks"`
	Frames          int32   `json:"Frames"`

	// Parsed from the file itself
	Players []PlayerStats  `gorm:"foreignKey:GameID;constraint:OnDelete:CASCADE"`
	Rounds  []Round        `gorm:"foreignKey:GameID;constraint:OnDelete:CASCADE"`
	Teams   []TeamScore    `gorm:"foreignKey:GameID;constraint:OnDelete:CASCADE"`
	Heatmap []HeatmapPoint `gorm:"foreignKey:GameID;constraint:OnDelete:CASCADE"`
	Utility []UtilityPoint `gorm:"foreignKey:GameID;constraint:OnDelete:CASCADE"`
}


type PlayerStats struct {
	ID        uint   `gorm:"primarykey"`
	GameID    uint   `gorm:"index"`
	SteamID   uint64
	Name      string
	Team      string // clan/team name the player belongs to
	Kills     int
	Deaths    int
	Assists   int
	Damage    int // total health damage dealt to enemies (for ADR)

	// Flash utility.
	FlashesAcquired   int
	FlashesThrown     int
	FlashRounds       int
	FlashesDiedWith   int
	EnemyFlashes      int
	EnemyFlashSeconds float64
	TeamFlashes       int
	TeamFlashSeconds  float64

	// HE grenades.
	HEAcquired int
	HEThrown   int
	HEDamage   int

	// Molotov / Incendiary (fire).
	MolotovAcquired int
	MolotovThrown   int
	MolotovDamage   int

	// Smoke.
	SmokeAcquired int
	SmokeThrown   int

	// Decoy.
	DecoyAcquired int
	DecoyThrown   int

	// Shooting-while-moving accuracy, split by weapon class. Each is a bullet
	// count: Accurate = on ground and below 34% of the weapon's max move speed,
	// Running = on ground but faster, Jump = fired airborne (excluded from the
	// accurate/running ratio). Heavy/knife/grenades/equipment are not counted.
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

// Round is the outcome of a single round within a game.
type Round struct {
	ID         uint   `gorm:"primarykey"`
	GameID     uint   `gorm:"index"`
	Number     int    // 1-based round number within the match
	WinnerSide string // "T" or "CT" — the side the winning team played this round
	WinnerClan string // team name of the winners
	LoserClan  string // team name of the losers
	Reason     string // how the round ended
}

// TeamScore is a team's total rounds won across the whole match.
type TeamScore struct {
	ID     uint   `gorm:"primarykey"`
	GameID uint   `gorm:"index"`
	Name   string
	Score  int
}

// HeatmapPoint is one kill/death location, normalized to 0..1 over the map's
// radar overview image.
type HeatmapPoint struct {
	ID      uint   `gorm:"primarykey"`
	GameID  uint   `gorm:"index"`
	X       float64
	Y       float64
	Kind    string // "kill" or "death"
	SteamID uint64 // the player this point belongs to
}

// UtilityPoint is one grenade detonation/landing ("pop") location, normalized
// to 0..1 over the map's radar overview image, attributed to the thrower.
type UtilityPoint struct {
	ID      uint   `gorm:"primarykey"`
	GameID  uint   `gorm:"index"`
	X       float64
	Y       float64
	Kind    string // "flash" | "he" | "molotov" | "smoke" | "decoy"
	SteamID uint64 // the thrower
}

