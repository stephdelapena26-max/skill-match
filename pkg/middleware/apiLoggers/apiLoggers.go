package apiloggers

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/gofiber/fiber/v3"
)

func SaveSystemLog(c fiber.Ctx, requestBody interface{}, responseBody interface{}, message string) {
	// 1. Ensure the directory exists
	logDir := "logs/system"
	if _, err := os.Stat(logDir); os.IsNotExist(err) {
		os.MkdirAll(logDir, 0755)
	}

	// 2. Open/Create the log file (named by current date)
	fileName := fmt.Sprintf("%s/%s.log", logDir, time.Now().Format("2006-01-02"))
	f, err := os.OpenFile(fileName, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		fmt.Printf("Error opening log file: %v\n", err)
		return
	}
	defer f.Close()

	// 3. Set the output of the log package to our file
	// We disable the default log flags because your format includes custom timestamps
	logger := log.New(f, "", 0)

	now := time.Now().Format("2006/01/02 15:04:05")
	path := c.Path()
	status := c.Response().StatusCode()

	// 4. Write the lines exactly as requested
	logger.Println(now)
	logger.Printf("INFO: %s %s: - - - - : %s : - - - -\n", now, path, message)
	logger.Printf("INFO: %s %s: PROCESS TIME: %s\n", now, path, now)
	logger.Printf("INFO: %s %s: REQUEST: %v\n", now, path, requestBody)
	logger.Printf("INFO: %s %s: RESPONSE: %v\n", now, path, responseBody)
	logger.Printf("INFO: %s %s: STATUS: %d\n", now, path, status)
}
