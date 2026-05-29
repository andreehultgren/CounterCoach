package models

import "time"

type Demo struct {
	ID        uint `gorm:"primarykey"`
	CreatedAt time.Time
	UpdatedAt time.Time
	Path      string
	// Hash is the SHA-256 of the demo file's contents, used to detect duplicate
	// imports regardless of file path/name. Empty for demos imported before this
	// was introduced (those fall back to path-based dedup).
	Hash string `gorm:"index"`
	// Exists is not stored in the DB; computed at fetch time by stat-ing Path.
	Exists bool `gorm:"-" json:"Exists"`

	// Analysis produced from this demo file (has-one).
	Game *Game `gorm:"foreignKey:DemoID;constraint:OnDelete:CASCADE" json:"Game,omitempty"`
}
