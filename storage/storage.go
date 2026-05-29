package storage

import (
	"os"
	"path/filepath"
)

func GetAppStoragePath() (string, error) {
	// Gets the OS-specific config directory
	configDir, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}

	// Append your app's name to create a dedicated folder
	appDir := filepath.Join(configDir, "CounterCoach")

	// Create the folder if it doesn't exist
	err = os.MkdirAll(appDir, 0755)
	if err != nil {
		return "", err
	}

	return appDir, nil
}
