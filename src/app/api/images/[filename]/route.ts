import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const UPLOADS_DIR = "\\\\itskom\\Y\\Даулет\\images";

export async function GET(request: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
    try {
        const { filename } = await params;
        const filePath = path.join(UPLOADS_DIR, filename);

        const data = await fs.readFile(filePath);
        const ext = path.extname(filename).toLowerCase();
        let mimeType = 'image/jpeg';
        if (ext === '.png') mimeType = 'image/png';
        if (ext === '.webp') mimeType = 'image/webp';
        if (ext === '.gif') mimeType = 'image/gif';
        if (ext === '.svg') mimeType = 'image/svg+xml';

        return new NextResponse(data, {
            headers: {
                "Content-Type": mimeType,
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch (e) {
        return new NextResponse("File not found", { status: 404 });
    }
}
