package controller_test

import (
	"blog/utils"
	"testing"
	"time"

	"github.com/golang-jwt/jwt"
	"github.com/magiconair/properties/assert"
	"github.com/spf13/viper"
)

func TestUserJWT(t *testing.T) {
	claims := &utils.JwtCustomClaims{
		Address: "0x7BceBBF3E62dcFfEda814866e5A9088E0423F1d3",
		IsAdmin: true,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: time.Now().Add(999 * time.Hour).Unix(),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	var err error
	_, err = token.SignedString([]byte(viper.GetString("secret")))
	assert.Equal(t, nil, err, "jwt failed")
}
