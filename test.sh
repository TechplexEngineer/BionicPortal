set -euo pipefail

# curl "https://api.cloudflare.com/client/v4/user/tokens/verify" \
#   -H "Authorization: Bearer PFROOzvpEMj5cj3A5tJz0UnXqN9Dr-daHO5HRmo-"

curl \
  https://api.cloudflare.com/client/v4/accounts/1db9917825f95bd7c7e1468383b8e3a4/ai/run/@cf/meta/llama-3-8b-instruct \
  -H "Authorization: Bearer PFROOzvpEMj5cj3A5tJz0UnXqN9Dr-daHO5HRmo-" \
  -d '{"messages":[
  {
    "role":"system",
    "content":"You are a friendly assistant that helps write stories"
  },{
    "role":"user",
    "content":"Write a short story about a llama that goes on a journey to find an orange cloud "
}]}'