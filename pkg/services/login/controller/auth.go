package AUTHcontroller

import (
	"template_school/pkg/middleware/helper"
	AUTHmodels "template_school/pkg/services/login/models"
	AUTHscript "template_school/pkg/services/login/script"

	"github.com/FDSAP-Git-Org/hephaestus/respcode"
	"github.com/gofiber/fiber/v3"
)

func Login(c fiber.Ctx) error {

	//Reqeust Body from the Model we made using Package calling (Global Calling)
	requestBody := AUTHmodels.RequestBody{}
	if reqErr := c.Bind().Body(&requestBody); reqErr != nil {
		//Error Handling Incase the application encounter Problem
		return helper.JSONResponseWithError(c.Status(400), respcode.ERR_CODE_400, respcode.ERR_CODE_400_MSG, reqErr)
	}
	//Call the function you made in the Script Folder using the Package you define
	resp, err := AUTHscript.AuthScriptLogin(requestBody)
	if err != nil {
		//Error Handling Incase the application encounter Problem
		return helper.JSONResponseWithError(c.Status(400), respcode.ERR_CODE_400, err.Error(), err)
	}
	//Return the response we Needed (can be modified based on your data needed)
	return helper.JSONResponseWithData(c, respcode.SUC_CODE_200, respcode.SUC_CODE_200_MSG, resp)
}
