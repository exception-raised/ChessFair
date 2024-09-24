# What is ChessFair?

ChessFair is a CLI application that analyzes Chess.com game archives to identify players who have been banned for fair play violations. It processes large sets of game data while adhering to Chess.com rate limits, utilizing batch processing and displaying progress with detailed progress bars.

# Benchmarks

| Amount of Archives       | Amount of Players     | Time Taken (m:s:ms) |
|--------------------------|-----------------------|---------------------|
| 28                       | 90                    | 00:06.857           |
| 48                       | 259                   | 00:18.508           |
| 62                       | 1057                  | 01:24.189           |
| 17                       | 3209                  | 03:30.215           |
| 105                      | 3486                  | 04:46.964           |
| 105                      | 15068                 | 26:32.262           |

* These benchmarks were conducted with the following configuration:
    - Batch Size  = 30
    - Batch Delay = 1000

These modifiers can be increased, at the potential cost of rate limits, which would affect the accuracy.

# How do I use it?

You will need to have NodeJS installed to use this program. Start by running the following command:

```bash

npm install

```

to install all the needed packages.

Then simply run

```bash

npm start

```

inside of the src folder.

# Docker Setup

You can run ChessFair easily in a Docker container. Follow the steps below to build and run the app in an isolated environment.

1. Build the Docker Image

First, build the Docker image from the Dockerfile included in the repository:

```bash

docker build -t chessfair .

```

This command will create a Docker image named chessfair using the project files.

2. Run the Application

To run the ChessFair app interactively (allowing terminal input for the username prompt), use the following command:

```bash

docker run -it --rm --name chessfair-app chessfair

```
--it: Enables interactive mode, so you can input data.

--rm: Automatically removes the container once it stops.

--name chessfair-app: Names the container instance chessfair-app.

3. Input Chess.com Username

Once the container starts, you’ll be prompted to input the Chess.com username you'd like to analyze.

4. Cleanup

Since we used --rm, the container is automatically cleaned up when the app finishes, leaving no residual files behind.


![ChessFair Demo Image](assets/demo.jpg)
