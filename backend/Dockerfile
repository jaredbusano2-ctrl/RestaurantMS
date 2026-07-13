FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443
ENV ASPNETCORE_URLS=http://+:80

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["RestaurantMS.API/RestaurantMS.API.csproj", "RestaurantMS.API/"]
COPY ["RestaurantMS.Core/RestaurantMS.Core.csproj", "RestaurantMS.Core/"]
COPY ["RestaurantMS.Infrastructure/RestaurantMS.Infrastructure.csproj", "RestaurantMS.Infrastructure/"]
RUN dotnet restore "RestaurantMS.API/RestaurantMS.API.csproj"
COPY . .
WORKDIR "/src/RestaurantMS.API"
RUN dotnet build "RestaurantMS.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "RestaurantMS.API.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "RestaurantMS.API.dll"]
