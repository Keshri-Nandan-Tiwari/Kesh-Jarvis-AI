# Multi-stage build: compile with full Maven+JDK, run with a slim JRE only.
# Keeps the final deployed image small (no build tools shipped to prod).

FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app

# Copy only pom.xml first so Docker caches the dependency download layer
# separately from source changes — much faster rebuilds during development.
COPY pom.xml .
RUN apk add --no-cache maven
RUN mvn -q dependency:go-offline

COPY src ./src
RUN mvn -q clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Render sets PORT dynamically — application.yml already reads ${PORT:8080}
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
