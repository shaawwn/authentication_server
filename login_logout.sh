#!/bin/bash

# The URL for your login endpoint
login_url="http://localhost:3000/login"

# The URL for your logout endpoint
logout_url="http://localhost:3000/logout"

# File where cookies will be stored
cookie_jar="cookies.txt"

# Login
# Adjust the -d option according to your API's expected login payload
login_response=$(curl -c $cookie_jar -X POST -H "Content-Type: application/json" -d '{"username":<testUser>,"password":<testPassword>}' $login_url)

echo "Login response: $login_response"

# Logout
# We use the cookie jar file to maintain session between requests
logout_response=$(curl -b $cookie_jar -X POST $logout_url)

echo "Logout response: $logout_response"

# Cleanup
rm $cookie_jar
