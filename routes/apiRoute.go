package routers

import (
	svcHealthcheck "template_school/pkg/services/healthCheck"
	AUTHcontroller "template_school/pkg/services/login/controller"

	"github.com/gofiber/fiber/v3"
)

func APIRoute(app *fiber.App) {
	publicV1 := app.Group("/api/public/v1")
	privateV1 := app.Group("/api/private/v1")

	// HealthCheck
	//Apit that be called of the FE/ FrontEnd
	publicV1.Get("/", svcHealthcheck.HealthCheck)
	privateV1.Get("/", svcHealthcheck.HealthCheck)

	//Call the function you made as endpoint or url
	auth := publicV1.Group("/authentication")
	auth.Post("/login", AUTHcontroller.Login)

	//The sample is the like this, get the http from the terminal http://127.0.0.1:8080/api/public/v1/authentication/login
}
