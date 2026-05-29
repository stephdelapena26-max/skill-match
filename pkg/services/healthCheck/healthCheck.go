package svcHealthcheck

import (
	apiloggers "template_school/pkg/middleware/apiLoggers"
	"template_school/pkg/middleware/helper"

	"github.com/FDSAP-Git-Org/hephaestus/respcode"
	"github.com/gofiber/fiber/v3"
)

func HealthCheck(c fiber.Ctx) error {
	message := "This service is running."
	responseBody := fiber.Map{
		"status":  "success",
		"message": message,
	}
	apiloggers.SaveSystemLog(c, "NO REQUEST BODY", responseBody, "HEALTHCHECK SUCCESS")
	return helper.JSONResponse(c, respcode.SUC_CODE_200, message)
}
