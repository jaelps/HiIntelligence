FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY ["HiIntelligence.Api/HiIntelligence.Api.csproj", "HiIntelligence.Api/"]
RUN dotnet restore "HiIntelligence.Api/HiIntelligence.Api.csproj"

# Copy everything else and build
COPY . .
WORKDIR "/src/HiIntelligence.Api"
RUN dotnet build "HiIntelligence.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "HiIntelligence.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Use runtime image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
EXPOSE 80
ENTRYPOINT ["dotnet", "HiIntelligence.Api.dll"]
