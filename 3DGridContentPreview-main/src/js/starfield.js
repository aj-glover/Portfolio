const randomInRange = (max, min) => Math.floor(Math.random() * (max - min + 1)) + min;
const BASE_SIZE = 1;
const STAR_COUNT = 280;
const STAR_SPEED = 2.5;
const MAX_SIZE = 3.5;

class Star {
	constructor(width, height) {
		this.reset(width, height);
	}

	reset(width, height) {
		const angle = Math.random() * Math.PI * 2;
		const vX = Math.cos(angle);
		const vY = Math.sin(angle);
		const travelled = Math.random() > 0.5 ? Math.random() * Math.max(width, height) + Math.random() * (width * 0.24) : Math.random() * (width * 0.25);
		this.iX = Math.floor(vX * travelled) + width / 2;
		this.iY = Math.floor(vY * travelled) + height / 2;
		this.x = this.iX;
		this.y = this.iY;
		this.vX = vX;
		this.vY = vY;
		this.alpha = 0.15 + Math.random() * 0.65;
		this.size = BASE_SIZE;
	}

	update(width, height) {
		this.iX = this.x;
		this.iY = this.y;
		this.x += this.vX * STAR_SPEED;
		this.y += this.vY * STAR_SPEED;
		const cx = width / 2;
		const cy = height / 2;
		const dist = Math.sqrt((this.x - cx) ** 2 + (this.y - cy) ** 2);
		const maxDist = Math.sqrt(cx * cx + cy * cy);
		this.size = BASE_SIZE + (dist / maxDist) * MAX_SIZE;
		return this.x < 0 || this.x > width || this.y < 0 || this.y > height;
	}
}

class Starfield {
	constructor(canvas) {
		this.canvas = canvas;
		this.ctx = this.canvas.getContext('2d');
		this.stars = [];
		this.resize();
		this.reset();
		window.addEventListener('resize', () => {
			this.resize();
			this.reset();
		});
		this.render = this.render.bind(this);
		this.render();
	}

	resize() {
		const dpr = window.devicePixelRatio || 1;
		this.width = window.innerWidth;
		this.height = window.innerHeight;
		this.canvas.width = this.width * dpr;
		this.canvas.height = this.height * dpr;
		this.canvas.style.width = `${this.width}px`;
		this.canvas.style.height = `${this.height}px`;
		this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	}

	reset() {
		this.stars = Array.from({ length: STAR_COUNT }, () => new Star(this.width, this.height));
	}

	render() {
		const { ctx, width, height, stars } = this;
		ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
		ctx.fillRect(0, 0, width, height);

		for (const star of stars) {
			const expired = star.update(width, height);
			ctx.strokeStyle = `rgba(255,255,255,${star.alpha})`;
			ctx.lineWidth = star.size;
			ctx.beginPath();
			ctx.moveTo(star.iX, star.iY);
			ctx.lineTo(star.x, star.y);
			ctx.stroke();
			if (expired) {
				star.reset(width, height);
			}
		}

		requestAnimationFrame(this.render);
	}
}

export const initStarfield = () => {
	const canvas = document.querySelector('.site-background');
	if (!canvas || canvas.tagName !== 'CANVAS') {
		return;
	}
	new Starfield(canvas);
};
