package model

type (
	Response struct {
		ResponseTime string      `json:"responseTime"`
		Device       string      `json:"device"`
		RetCode      string      `json:"retCode"`
		Message      string      `json:"message"`
		Data         interface{} `json:"data,omitempty"`
		Error        interface{} `json:"error,omitempty"`
	}

	EPResponse struct {
		ProcessTime string      `json:"processTime"`
		Response    interface{} `json:"response"`
	}
)
