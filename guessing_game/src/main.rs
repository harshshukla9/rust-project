use actix_cors::Cors;
use actix_web::{web, App, HttpServer, HttpResponse, Responder, middleware};
use rand::Rng;
use serde::{Serialize, Deserialize};
use std::sync::{Arc, Mutex};

#[derive(Clone)]
struct GameState {
    secret_number: Arc<Mutex<i32>>,
    prize: Arc<Mutex<f64>>,
}

#[derive(Deserialize)]
struct Guess {
    guess: i32,
}

#[derive(Serialize)]
struct ResponseMessage {
    message: String,
    prize: f64,
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let state = GameState {
        secret_number: Arc::new(Mutex::new(rand::thread_rng().gen_range(1..=100))),
        prize: Arc::new(Mutex::new(1.0)), // Start with 1 SOL
    };

    let server_address = "0.0.0.0:8080"; // Define server address

    println!("🚀 Web server is starting on http://{}", server_address);

    HttpServer::new(move || {
        App::new()
            .wrap(Cors::permissive()) // Allow CORS for frontend
            .wrap(middleware::Logger::default()) // Log requests
            .app_data(web::Data::new(state.clone()))
            .route("/start", web::get().to(start_game))
            .route("/guess", web::post().to(make_guess))
    })
    .bind(server_address)?
    .run()
    .await
}

// 🎯 Start the game
async fn start_game(state: web::Data<GameState>) -> impl Responder {
    let mut secret_number = match state.secret_number.lock() {
        Ok(num) => num,
        Err(_) => return HttpResponse::InternalServerError().body("Error accessing game state"),
    };
    
    let mut prize = match state.prize.lock() {
        Ok(prize) => prize,
        Err(_) => return HttpResponse::InternalServerError().body("Error accessing prize state"),
    };

    *secret_number = rand::thread_rng().gen_range(1..=100);
    *prize = 1.0; // Reset prize

    println!("🎮 New game started! Secret number: {}", *secret_number);

    HttpResponse::Ok().json(ResponseMessage {
        message: "Game started! Guess a number between 1 and 100.".to_string(),
        prize: *prize,
    })
}

// 🎯 Handle a guess
async fn make_guess(guess: web::Json<Guess>, state: web::Data<GameState>) -> impl Responder {
    let secret = match state.secret_number.lock() {
        Ok(num) => *num,
        Err(_) => return HttpResponse::InternalServerError().body("Error accessing game state"),
    };

    let mut prize = match state.prize.lock() {
        Ok(prize) => prize,
        Err(_) => return HttpResponse::InternalServerError().body("Error accessing prize state"),
    };

    let message = if guess.guess == secret {
        println!("✅ Correct guess: {} 🎉", guess.guess);
        "🎉 Correct! You won!".to_string()
    } else if guess.guess < secret {
        println!("📉 Too low: {}", guess.guess);
        "Too low! Try again.".to_string()
    } else {
        println!("📈 Too high: {}", guess.guess);
        "Too high! Try again.".to_string()
    };

    // Update prize (divide by 2 but keep at least 0.0001 SOL)
    if guess.guess != secret {
        *prize = (*prize / 2.0).max(0.0001);
    }

    HttpResponse::Ok().json(ResponseMessage {
        message,
        prize: *prize,
    })
}
