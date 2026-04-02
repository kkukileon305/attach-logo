export async function loadImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = reject;
		img.src = src;
	});
}

export interface ProcessOptions {
	mode: string;
	position: { x: number; y: number };
	custom: { horizontal: string; vertical: string; x: number; y: number };
	logoScale: number;
}

export async function processImage(imageFile: File, logoFile: File, options: ProcessOptions): Promise<Blob | null> {
	const imageSrc = URL.createObjectURL(imageFile);
	const logoSrc = URL.createObjectURL(logoFile);

	const [img, logo] = await Promise.all([
		loadImage(imageSrc),
		loadImage(logoSrc)
	]);

	const canvas = document.createElement('canvas');
	canvas.width = img.width;
	canvas.height = img.height;
	const ctx = canvas.getContext('2d');
    
    if (!ctx) return null;

	// Draw original image at full resolution
	ctx.drawImage(img, 0, 0);

	const logoScale = options.logoScale || 0.2;
	const logoDisplayWidth = img.width * logoScale;
	const logoDisplayHeight = logo.height * (logoDisplayWidth / logo.width);

	let x = 0;
	let y = 0;

	if (options.mode === 'drag') {
		x = options.position.x * img.width;
		y = options.position.y * img.height;
	} else if (options.mode === 'center') {
		x = (img.width - logoDisplayWidth) / 2;
		y = (img.height - logoDisplayHeight) / 2;
	} else if (options.mode === 'custom') {
        const mx = Number(options.custom.x) || 0;
        const my = Number(options.custom.y) || 0;
		x = options.custom.horizontal === 'left' ? mx : (img.width - logoDisplayWidth - mx);
		y = options.custom.vertical === 'top' ? my : (img.height - logoDisplayHeight - my);
	}

	ctx.drawImage(logo, x, y, logoDisplayWidth, logoDisplayHeight);

	URL.revokeObjectURL(imageSrc);
	URL.revokeObjectURL(logoSrc);

	return new Promise((resolve) => {
		canvas.toBlob((blob) => {
			resolve(blob);
		}, imageFile.type, 1.0);
	});
}
