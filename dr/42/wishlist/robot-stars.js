/* Robot Stars Effect - JavaScript */
/* Подключите этот файл для логики эффекта */

class RobotStars {
    constructor(options = {}) {
        this.starCount = options.starCount || 37;
        this.gravityChangeInterval = options.gravityChangeInterval || [3000, 8000]; // мин и макс в мс
        this.containerClass = options.containerClass || 'robot-stars-container';
        
        this.container = null;
        this.stars = [];
        this.currentGravityDirection = 'down';
        this.mouseX = window.innerWidth / 2;
        this.mouseY = window.innerHeight / 2;
        this.mouseInWindow = false;
        
        // 8 направлений гравитации
        this.gravityDirections = [
            { name: 'down', x: 0, y: 1 },
            { name: 'up', x: 0, y: -1 },
            { name: 'left', x: -1, y: 0 },
            { name: 'right', x: 1, y: 0 },
            { name: 'down-right', x: 0.7, y: 0.7 },
            { name: 'down-left', x: -0.7, y: 0.7 },
            { name: 'up-right', x: 0.7, y: -0.7 },
            { name: 'up-left', x: -0.7, y: -0.7 }
        ];
        
        this.init();
    }
    
    init() {
        // Создаем контейнер
        this.container = document.createElement('div');
        this.container.className = this.containerClass;
        this.container.id = 'robotStarsContainer';
        document.body.appendChild(this.container);
        
        // Создаем звездочки
        for (let i = 0; i < this.starCount; i++) {
            this.stars.push(this.createStar());
        }
        
        // Настройка событий мыши
        this.setupMouseTracking();
        
        // Запуск анимаций
        this.trackStarPositions();
        this.applyGravity();
        
        // Первая смена гравитации
        const [min, max] = this.gravityChangeInterval;
        setTimeout(() => this.changeGravity(), Math.random() * (max - min) + min);
    }
    
    createStar() {
        const star = document.createElement('div');
        star.classList.add('robot-star');
        
        const middleLine = document.createElement('div');
        middleLine.className = 'line-middle';
        star.appendChild(middleLine);
        
        const startPositionX = Math.random() * window.innerWidth;
        const startPositionY = Math.random() * window.innerHeight;
        const opacity = Math.random() * 0.5 + 0.3;
        const size = Math.random() * 20 + 15;
        const duration = Math.random() * 8 + 12;
        
        // Случайный выбор одной из трех анимаций
        const animations = ['fall', 'fall2', 'fall3'];
        const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
        
        star.style.opacity = opacity;
        star.style.width = size + 'px';
        star.style.height = size + 'px';
        star.style.animationName = randomAnimation;
        star.style.animationDuration = duration + 's';
        
        // Сохраняем данные звездочки
        star.dataset.startX = startPositionX;
        star.dataset.startY = startPositionY;
        star.dataset.mass = Math.random() * 1.5 + 0.5;
        star.dataset.size = size;
        star.dataset.lastX = startPositionX;
        star.dataset.lastY = startPositionY;
        star.dataset.lastRotation = 0;
        
        this.container.appendChild(star);
        return star;
    }
    
    createTrail(x, y, size, rotation) {
        const trail = document.createElement('div');
        trail.classList.add('robot-star-trail');
        
        const middleLine = document.createElement('div');
        middleLine.className = 'line-middle';
        trail.appendChild(middleLine);
        
        trail.style.left = x + 'px';
        trail.style.top = y + 'px';
        trail.style.width = size + 'px';
        trail.style.height = size + 'px';
        trail.style.transform = `rotate(${rotation}deg)`;
        
        this.container.appendChild(trail);
        
        // Удаляем след после завершения анимации
        setTimeout(() => {
            trail.remove();
        }, 800);
    }
    
    setupMouseTracking() {
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            this.mouseInWindow = true;
        });
        
        document.addEventListener('mouseenter', () => {
            this.mouseInWindow = true;
        });
        
        document.addEventListener('mouseleave', () => {
            this.mouseInWindow = false;
            this.mouseX = window.innerWidth / 2;
            this.mouseY = window.innerHeight / 2;
        });
    }
    
    trackStarPositions() {
        this.stars.forEach(star => {
            const rect = star.getBoundingClientRect();
            const containerRect = this.container.getBoundingClientRect();
            
            const currentX = rect.left - containerRect.left + rect.width / 2;
            const currentY = rect.top - containerRect.top + rect.height / 2;
            
            const lastX = parseFloat(star.dataset.lastX);
            const lastY = parseFloat(star.dataset.lastY);
            
            // Вычисляем расстояние перемещения
            const distance = Math.sqrt(Math.pow(currentX - lastX, 2) + Math.pow(currentY - lastY, 2));
            
            // Если звездочка резко прыгнула (больше 30px за кадр), оставляем след
            if (distance > 30) {
                const size = parseFloat(star.dataset.size);
                const computedStyle = window.getComputedStyle(star);
                const transform = computedStyle.transform;
                
                // Извлекаем угол поворота из матрицы трансформации
                let rotation = 0;
                if (transform !== 'none') {
                    const values = transform.split('(')[1].split(')')[0].split(',');
                    const a = parseFloat(values[0]);
                    const b = parseFloat(values[1]);
                    rotation = Math.round(Math.atan2(b, a) * (180 / Math.PI));
                }
                
                this.createTrail(lastX - size / 2, lastY - size / 2, size, rotation);
            }
            
            // Обновляем последнюю позицию
            star.dataset.lastX = currentX;
            star.dataset.lastY = currentY;
        });
        
        requestAnimationFrame(() => this.trackStarPositions());
    }
    
    applyGravity() {
        const gravity = this.gravityDirections.find(g => g.name === this.currentGravityDirection);
        
        // Определяем точку поворота (мышь или центр экрана)
        const pivotX = this.mouseInWindow ? this.mouseX : window.innerWidth / 2;
        const pivotY = this.mouseInWindow ? this.mouseY : window.innerHeight / 2;
        
        this.stars.forEach(star => {
            const startX = parseFloat(star.dataset.startX);
            const startY = parseFloat(star.dataset.startY);
            const mass = parseFloat(star.dataset.mass);
            
            star.style.left = startX + 'px';
            star.style.top = startY + 'px';
            
            // Разная скорость перехода в зависимости от массы
            const transitionDuration = 0.3 + (mass - 0.5) * 0.8;
            star.style.transition = `transform ${transitionDuration}s ease-out`;
        });
        
        // Поворачиваем весь контейнер в зависимости от направления гравитации
        let rotation = 0;
        switch(this.currentGravityDirection) {
            case 'down': rotation = 0; break;
            case 'up': rotation = 180; break;
            case 'left': rotation = 90; break;
            case 'right': rotation = -90; break;
            case 'down-right': rotation = -45; break;
            case 'down-left': rotation = 45; break;
            case 'up-right': rotation = -135; break;
            case 'up-left': rotation = 135; break;
        }
        
        // Устанавливаем точку трансформации относительно позиции мыши
        const pivotXPercent = (pivotX / window.innerWidth) * 100;
        const pivotYPercent = (pivotY / window.innerHeight) * 100;
        
        this.container.style.transformOrigin = `${pivotXPercent}% ${pivotYPercent}%`;
        this.container.style.transform = `rotate(${rotation}deg)`;
        this.container.style.transition = 'transform 1s ease-in-out, transform-origin 0.3s ease-out';
        
        console.log(`Поворот вокруг: ${this.mouseInWindow ? 'курсор мыши' : 'центр экрана'} (${Math.round(pivotX)}, ${Math.round(pivotY)})`);
    }
    
    changeGravity() {
        const randomDirection = this.gravityDirections[Math.floor(Math.random() * this.gravityDirections.length)];
        this.currentGravityDirection = randomDirection.name;
        console.log('Новое направление гравитации:', this.currentGravityDirection);
        
        this.applyGravity();
        
        // Следующая смена через случайное время
        const [min, max] = this.gravityChangeInterval;
        const nextChange = Math.random() * (max - min) + min;
        setTimeout(() => this.changeGravity(), nextChange);
    }
    
    // Метод для уничтожения эффекта
    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}

// Автоматическая инициализация, если нужно
if (typeof window !== 'undefined') {
    window.RobotStars = RobotStars;
}
