using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using HiIntelligence.Api.Data;
using HiIntelligence.Api.Models;

namespace HiIntelligence.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;

        public AuthController(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        public class LoginModel
        {
            public string Username { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginModel model)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == model.Username.ToLower());
            if (user == null || !VerifyMockHash(model.Password, user.PasswordHash))
            {
                return Unauthorized(new { Message = "Incorret credentials. For demo, try: admin (admin123), regional_east (east123), or store_101 (store123)" });
            }

            var tokenHandler = new JwtSecurityTokenHandler();
            var jwtKey = _config["JWT:Key"] ?? "HiIntelligenceSuperSecretKey2026ExtraLongValueForHmacSha256!";
            var key = Encoding.UTF8.GetBytes(jwtKey);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Role, user.Role.ToString()),
                new Claim("AssignedRegion", user.AssignedRegion ?? ""),
                new Claim("AssignedStoreId", user.AssignedStoreId?.ToString() ?? "")
            };

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddMinutes(int.Parse(_config["JWT:ExpiryMinutes"] ?? "360")),
                Issuer = _config["JWT:Issuer"] ?? "HiIntelligenceApi",
                Audience = _config["JWT:Audience"] ?? "HiIntelligenceClient",
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            var tokenString = tokenHandler.WriteToken(token);

            return Ok(new
            {
                Token = tokenString,
                Username = user.Username,
                Role = user.Role.ToString(),
                AssignedRegion = user.AssignedRegion,
                AssignedStoreId = user.AssignedStoreId
            });
        }

        private bool VerifyMockHash(string password, string hash)
        {
            // For demo purposes, we base64-encode the string as mock hash
            var mockHash = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(password));
            return mockHash == hash;
        }
    }
}
