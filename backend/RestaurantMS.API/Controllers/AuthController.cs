using Microsoft.AspNetCore.Mvc;
using RestaurantMS.Core.DTOs;
using RestaurantMS.Core.Interfaces;

namespace RestaurantMS.API.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        {
            try
            {
                var result = await _authService.LoginAsync(request);
                if (result == null)
                    return Unauthorized(ApiResponse<string>.Fail("Invalid email or password."));

                return Ok(ApiResponse<LoginResponseDto>.Ok(result, "Login successful."));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new {
                    error = ex.Message,
                    inner = ex.InnerException?.Message,
                    stack = ex.StackTrace
                });
            }
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
        {
            try
            {
                var result = await _authService.RegisterAsync(request);
                if (!result)
                    return BadRequest(ApiResponse<string>.Fail("Email already exists."));

                return Ok(ApiResponse<string>.Ok("User registered.", "Registration successful."));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new {
                    error = ex.Message,
                    inner = ex.InnerException?.Message
                });
            }
        }
    }
}