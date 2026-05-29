package AUTHmodels

// The Struct the Request Body format need, it can be change Based on the needed Data or Request
type (
	RequestBody struct {
		Login    string `json:"login"`
		Password string `json:"password"`
	}
	//Response of the Code can be change the value based on the need Response
	//Take note the Struct Global named and the json must be the same, not a proble if it lower or upper case
	//always use Json for Easy Integration in UI side/FrontEnd
	Response struct {
		Message string `json:"message"`
	}
)
