package main

import (
	"os"
	"syscall"
	"time"
)

// fileBirthTime returns the file's creation time (birthtime). On macOS/APFS this
// is set when the file first lands on disk and survives a rename. ok is false if
// it can't be determined, in which case the caller should fall back to mtime.
func fileBirthTime(info os.FileInfo) (t time.Time, ok bool) {
	st, ok := info.Sys().(*syscall.Stat_t)
	if !ok {
		return time.Time{}, false
	}
	bt := st.Birthtimespec
	if bt.Sec == 0 && bt.Nsec == 0 {
		return time.Time{}, false
	}
	return time.Unix(bt.Sec, bt.Nsec), true
}
