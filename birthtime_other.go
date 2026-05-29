//go:build !darwin

package main

import (
	"os"
	"time"
)

// fileBirthTime has no portable implementation off darwin; callers fall back to
// the file's modification time.
func fileBirthTime(info os.FileInfo) (t time.Time, ok bool) {
	return time.Time{}, false
}
