package AUTHscript

import (
	AUTHmodels "template_school/pkg/services/login/models"
)

// This file is for query or SQL code to avoid long code definiton
func AuthScriptLogin(req AUTHmodels.RequestBody) (string, error) {
	//Validation Information
	// if req.Login != "" || req.Password != "" {
	// 	//Return Error
	// 	return "", fmt.Errorf("Fields must have value")
	// }
	//Return Success
	return "Succes Login", nil
}
