import pygame
import sys
import random

# Initialize Pygame
pygame.init()

# Screen dimensions and settings
SCREEN_WIDTH = 400
SCREEN_HEIGHT = 600
FPS = 60
GRAVITY = 0.25
PIPE_WIDTH = 60
PIPE_GAP = 150
PIPE_SPEED = 3
SPEED_INCREMENT = 0.1

# Colors
SKY_BLUE = (135, 206, 235)
GREEN = (34, 139, 34)
BIRD_COLOR = (255, 255, 0)
PIPE_COLOR = (0, 0, 139)
SCORE_COLOR = (0, 0, 0)
EYE_COLOR = (0, 0, 0)

# Initialize screen
screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
pygame.display.set_caption("Flappy Bird")

# Clock for controlling the frame rate
clock = pygame.time.Clock()

# Bird properties
bird = pygame.Rect(SCREEN_WIDTH // 4, SCREEN_HEIGHT // 2, 30, 30)
bird_movement = 0

# Game states
game_active = False
score = 0
current_speed = PIPE_SPEED

# Font for text
font = pygame.font.Font(None, 36)

# Pipe properties
pipe_list = []
SPAWN_PIPE = pygame.USEREVENT
pygame.time.set_timer(SPAWN_PIPE, 1200)

# Load high score
def load_high_score():
    try:
        with open("score.txt", "r") as file:
            return int(file.read().strip())
    except (FileNotFoundError, ValueError):
        return 0

# Save high score
def save_high_score(high_score):
    with open("score.txt", "w") as file:
        file.write(str(high_score))

high_score = load_high_score()

def create_pipe():
    height = random.randint(150, SCREEN_HEIGHT - PIPE_GAP - 150)
    top_pipe = pygame.Rect(SCREEN_WIDTH, 0, PIPE_WIDTH, height)
    bottom_pipe = pygame.Rect(SCREEN_WIDTH, height + PIPE_GAP, PIPE_WIDTH, SCREEN_HEIGHT - height - PIPE_GAP)
    return top_pipe, bottom_pipe

def move_pipes(pipes, speed):
    for pipe in pipes:
        pipe.x -= speed
    return [pipe for pipe in pipes if pipe.right > 0]

def draw_pipes(pipes):
    for pipe in pipes:
        pygame.draw.rect(screen, PIPE_COLOR, pipe)
        if pipe.top == 0:
            pygame.draw.rect(screen, PIPE_COLOR, (pipe.x, pipe.bottom - 10, PIPE_WIDTH, 10))
        else:
            pygame.draw.rect(screen, PIPE_COLOR, (pipe.x, pipe.top, PIPE_WIDTH, 10))

def check_collision(pipes):
    for pipe in pipes:
        if bird.colliderect(pipe):
            return False
    if bird.top <= 0 or bird.bottom >= SCREEN_HEIGHT - 50:
        return False
    return True

def draw_background():
    screen.fill(SKY_BLUE)
    pygame.draw.rect(screen, GREEN, (0, SCREEN_HEIGHT - 50, SCREEN_WIDTH, 50))

def display_message(text, y_offset=0):
    message = font.render(text, True, (0, 0, 0))
    message_rect = message.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + y_offset))
    screen.blit(message, message_rect)

def draw_bird():
    pygame.draw.ellipse(screen, BIRD_COLOR, bird)
    pygame.draw.circle(screen, EYE_COLOR, (bird.centerx + 5, bird.centery - 5), 3)

def display_score():
    score_text = font.render(f"Score: {int(score)}", True, SCORE_COLOR)
    score_rect = score_text.get_rect(center=(SCREEN_WIDTH // 2, 20))
    screen.blit(score_text, score_rect)
    
    hiscore_text = font.render(f"High Score: {int(high_score)}", True, SCORE_COLOR)
    hiscore_rect = hiscore_text.get_rect(center=(SCREEN_WIDTH // 2, 50))
    screen.blit(hiscore_text, hiscore_rect)

def main():
    global bird_movement, game_active, pipe_list, score, current_speed, high_score

    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_RETURN:
                    if not game_active:
                        game_active = True
                        bird.y = SCREEN_HEIGHT // 2
                        bird_movement = 0
                        pipe_list.clear()
                        score = 0
                        current_speed = PIPE_SPEED
                if event.key in (pygame.K_UP, pygame.K_SPACE) and game_active:
                    bird_movement = -5
            if event.type == SPAWN_PIPE and game_active:
                pipe_list.extend(create_pipe())

        draw_background()

        if game_active:
            bird_movement += GRAVITY
            bird.y += bird_movement
            draw_bird()
            pipe_list = move_pipes(pipe_list, current_speed)
            draw_pipes(pipe_list)
            game_active = check_collision(pipe_list)
            score += 0.01
            if int(score) % 10 == 0 and int(score) > 0:
                current_speed = PIPE_SPEED + (int(score) // 10) * SPEED_INCREMENT
            display_score()
        else:
            if int(score) > high_score:
                high_score = int(score)
                save_high_score(high_score)
            message = "Press Enter to Play Again" if pipe_list else "Press Enter to Play"
            display_message(message)
            display_message(f"Score: {int(score)}", y_offset=40)
            display_message(f"High Score: {int(high_score)}", y_offset=80)

        pygame.display.update()
        clock.tick(FPS)

main()
