package models

import "time"

type Demo struct {
	ID        uint `gorm:"primarykey"`
	CreatedAt time.Time
	UpdatedAt time.Time
	Path      string
	// Exists is not stored in the DB; computed at fetch time by stat-ing Path.
	Exists bool `gorm:"-" json:"Exists"`

	// Analysis produced from this demo file (has-one).
	Game *Game `gorm:"foreignKey:DemoID;constraint:OnDelete:CASCADE" json:"Game,omitempty"`
}
