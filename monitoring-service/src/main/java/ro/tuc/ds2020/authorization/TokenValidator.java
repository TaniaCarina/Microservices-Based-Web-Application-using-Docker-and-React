package ro.tuc.ds2020.authorization;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;

import java.util.Base64;

public class TokenValidator {

    private static final String SECRETKEY = "sdjeile2UdUYfdPeNtskjhdh0dLFKtpNWhhusRP5sy6E=";
    private static Base64.Decoder decoder = Base64.getUrlDecoder();
    public boolean validate(String token) {

        try {
            Claims claims = Jwts.parser()
                    .setSigningKey(SECRETKEY)
                    .parseClaimsJws(token)
                    .getBody();
            return !claims.getExpiration().before(new java.util.Date());
        } catch (Exception e) {
            System.out.println(e);
            return false;
        }
    }
}
