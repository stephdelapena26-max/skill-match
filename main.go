package main

import (
	"encoding/json"
	"fmt"
	"log"
	"strings"
	DBConnection "template_school/pkg/middleware/databaseConnection"
	routers "template_school/routes"

	"github.com/FDSAP-Git-Org/hephaestus/apilogs"
	utils_v1 "github.com/FDSAP-Git-Org/hephaestus/utils/v1"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
	"github.com/gofiber/fiber/v3/middleware/logger"
	"github.com/gofiber/fiber/v3/middleware/recover"
	"github.com/joho/godotenv"
)

func init() {
	// 1. Load environment name
	env := utils_v1.GetEnv("ENVIRONMENT")
	loadedEnv := strings.ToLower(env)
	if loadedEnv == "" {
		loadedEnv = "local"
	}

	fmt.Println("ENVIRONMENT:", strings.ToUpper(loadedEnv))

	// 2. Load environment settings from the specific file
	envPath := fmt.Sprintf("./envs/.env-%s", loadedEnv)
	if envErr := godotenv.Load(envPath); envErr != nil {
		log.Printf("Note: %s not found, relying on system env\n", envPath)
	}

	fmt.Println("PROJECT:    ", utils_v1.GetEnv("PROJECT"))
	fmt.Println("DESCRIPTION:", utils_v1.GetEnv("DESCRIPTION"))

	// 3. Setup logging folders
	folders := []string{"system"}
	apilogs.CreateInitialFolder(folders)

	// 4. Connect to DB (Raw data from ENV)
	if !DBConnection.PostgreSQLConnect() {
		log.Fatal("Failed to initialize database connections")
	}
}

func main() {
	// Initialize Fiber App
	app := fiber.New(fiber.Config{
		AppName:          utils_v1.GetEnv("PROJECT"),
		CaseSensitive:    true,
		DisableKeepalive: true,
		JSONEncoder:      json.Marshal,
		JSONDecoder:      json.Unmarshal,
	})

	// Middleware
	app.Use(cors.New(cors.Config{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders: []string{"Origin", "Content-Type", "Accept", "Authorization"},
	}))

	app.Use(logger.New())
	app.Use(recover.New())

	// Initialize API Endpoints
	routers.APIRoute(app)

	// Start Server
	port := utils_v1.GetEnv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("🚀 Server starting on port %s\n", port)
	log.Fatal(app.Listen(fmt.Sprintf(":%s", port)))
}
