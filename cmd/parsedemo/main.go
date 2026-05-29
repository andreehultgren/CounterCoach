package main

import (
	"fmt"
	"os"
	"path/filepath"

	"countercoach/analysis"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Fprintln(os.Stderr, "usage: parsedemo <demo-file>")
		fmt.Fprintln(os.Stderr, "  <demo-file> is a filename inside the demos/ folder, or an absolute/relative path")
		os.Exit(1)
	}

	arg := os.Args[1]

	// If arg is not an existing path, assume it lives in demos/.
	path := arg
	if _, err := os.Stat(path); err != nil {
		path = filepath.Join("demos", arg)
	}

	if _, err := os.Stat(path); err != nil {
		fmt.Fprintf(os.Stderr, "demo not found: %s\n", path)
		os.Exit(1)
	}

	analysis.ParseDemo(path, true)
}
