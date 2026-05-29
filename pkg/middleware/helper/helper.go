package helper

import (
	"template_school/pkg/middleware/helper/model"

	utils_v1 "github.com/FDSAP-Git-Org/hephaestus/utils/v1"
	"github.com/gofiber/fiber/v3"
)

func JSONResponse(c fiber.Ctx, retCode, retMessage string) error {
	return c.JSON(model.Response{
		ResponseTime: utils_v1.GetResponseTime(c),
		Device:       string(c.RequestCtx().UserAgent()),
		RetCode:      retCode,
		Message:      retMessage,
	})
}

func JSONResponseWithData(c fiber.Ctx, retCode, retMessage string, data interface{}) error {
	return c.JSON(model.Response{
		ResponseTime: utils_v1.GetResponseTime(c),
		Device:       string(c.RequestCtx().UserAgent()),
		RetCode:      retCode,
		Message:      retMessage,
		Data:         data,
	})
}

func JSONResponseWithError(c fiber.Ctx, retCode, retMessage string, err error) error {
	return c.JSON(model.Response{
		ResponseTime: utils_v1.GetResponseTime(c),
		Device:       string(c.RequestCtx().UserAgent()),
		RetCode:      retCode,
		Message:      retMessage,
		Error:        err.Error(),
	})
}
