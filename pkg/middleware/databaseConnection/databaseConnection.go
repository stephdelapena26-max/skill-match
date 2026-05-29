package DBConnection

import (
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/go-redis/redis/v8"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres" // Required for GORM + Postgres
	"gorm.io/gorm"
)

var (
	DBConnList []gorm.DB
	DBErr      error

	RedisClient *redis.Client
	RedisError  error
)

func PostgreSQLConnect() bool {
	// 1. Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// 2. Get Raw Data from Environment
	host := os.Getenv("DB_HOST")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	port := os.Getenv("DB_PORT")
	sslmode := os.Getenv("DB_SSLMODE")   // e.g., "disable"
	timezone := os.Getenv("DB_TIMEZONE") // e.g., "Asia/Manila"

	// Get comma-separated DB names from ENV (e.g., DB_LIST=users,orders,inventory)
	dbListRaw := os.Getenv("DB_LIST")
	dbNames := strings.Split(dbListRaw, ",")

	// 3. Connect to each Database
	for _, dbName := range dbNames {
		dbName = strings.TrimSpace(dbName)
		if dbName == "" {
			continue
		}

		// Build Connection String (DSN)
		dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=%s",
			host, user, password, dbName, port, sslmode, timezone)

		// Open GORM Connection
		dbConn, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
		if err != nil {
			log.Fatalf("FAILED TO CONNECT TO %s: %v", dbName, err)
			return false
		}

		// Verify Connection
		sqlDB, err := dbConn.DB()
		if err != nil {
			log.Fatalf("FAILED TO GET INSTANCE FOR %s: %v", dbName, err)
		}

		if err := sqlDB.Ping(); err != nil {
			log.Fatalf("FAILED TO PING %s: %v", dbName, err)
		}

		fmt.Printf("DATABASE %s CONNECTION STATUS: ✔\n", strings.ToUpper(dbName))

		// Append to the global list
		DBConnList = append(DBConnList, *dbConn)
	}

	fmt.Println("TIMEZONE CONFIGURED:", timezone)
	return true
}
