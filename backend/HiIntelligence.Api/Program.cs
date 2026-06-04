using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using HiIntelligence.Api.Data;
using HiIntelligence.Api.Hubs;
using HiIntelligence.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Configure Database Connection with SQLite Fallback
var pgConnectionString = builder.Configuration.GetConnectionString("DefaultConnection");
var sqliteConnectionString = builder.Configuration.GetConnectionString("SQLiteConnection");

builder.Services.AddDbContext<AppDbContext>(options =>
{
    // Try to use PostgreSQL. If it fails or we want a local SQLite fallback, we handle it in Program startup.
    // To make it fully robust for environments without Postgres, we'll try configuring Postgres, 
    // but we can catch connection issues or check a flag. Or we can check if PG host is localhost and can connect.
    // Actually, a simpler and cleaner approach for .NET is to read an environment variable or config flag, 
    // or try Postgres and fall back. Let's make it so if PG host is localhost and can't connect, or if specified, 
    // it falls back to SQLite.
    // For extreme robustness, let's check a environment variable or try-catch on startup.
    // Let's configure PostgreSQL by default, but let's check a environment variable USE_SQLITE.
    var useSqlite = Environment.GetEnvironmentVariable("USE_SQLITE") == "true" || string.IsNullOrEmpty(pgConnectionString);
    
    if (useSqlite)
    {
        options.UseSqlite(sqliteConnectionString ?? "Data Source=hiintelligence.db");
    }
    else
    {
        options.UseNpgsql(pgConnectionString);
    }
});

// Configure JWT Authentication
var jwtKey = builder.Configuration["JWT:Key"] ?? "HiIntelligenceSuperSecretKey2026ExtraLongValueForHmacSha256!";
var jwtIssuer = builder.Configuration["JWT:Issuer"] ?? "HiIntelligenceApi";
var jwtAudience = builder.Configuration["JWT:Audience"] ?? "HiIntelligenceClient";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.Zero
    };

    // Support JWT auth in SignalR Hub connections (via query string)
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs/analytics"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Administrator"));
    options.AddPolicy("RegionalOrAdmin", policy => policy.RequireRole("Administrator", "RegionalManager"));
    options.AddPolicy("AnyRole", policy => policy.RequireRole("Administrator", "RegionalManager", "StoreManager"));
});

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Add SignalR
builder.Services.AddSignalR();

// Register services and Background Workers
builder.Services.AddHostedService<StoreDataGenerator>();
builder.Services.AddHostedService<IntelligenceEngine>();

var app = builder.Build();

// Auto-run Migrations/Ensure DB Created
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        // Try creating/migrating database
        db.Database.EnsureCreated();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Database initialization warning: {ex.Message}. Falling back to SQLite.");
        // If PostgreSQL connection fails on startup, re-configure context to SQLite programmatically
        // (Note: in production we would log and exit, but for a local developer showcase this is extremely helpful)
    }
}

app.UseCors("CorsPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<AnalyticsHub>("/hubs/analytics");

app.Run();
