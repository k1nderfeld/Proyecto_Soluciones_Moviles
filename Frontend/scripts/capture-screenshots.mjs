import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = process.env.APP_URL ?? 'http://localhost:8081';
const OUT = 'docs/screenshots';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@example.test';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  throw new Error('Define ADMIN_PASSWORD para capturar el panel de administración.');
}

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  locale: 'es-CL',
});
const page = await context.newPage();
page.setDefaultTimeout(90_000);

const shot = async (name) => {
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`saved ${name}.png`);
};

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.getByText('Descubre qué roca tienes en tus manos').waitFor();
await shot('01-inicio');

await page.getByText('Explorar como invitado').click();
await page.getByText('Hola, explorador').waitFor();
await shot('02-inicio-invitado');

await page.getByRole('tab', { name: /Catálogo/ }).click();
await page.getByText('Catálogo de rocas').waitFor();
await shot('03-catalogo');

await page.getByRole('link', { name: /Ver detalle de Basalto/ }).click({ force: true });
await page.getByText('Composición').waitFor();
await shot('04-detalle-roca');

await page.goBack();
await page.getByRole('tab', { name: /Reconocer/ }).click();
await page.getByText('Fotografía una muestra y deja que el modelo la identifique').waitFor();
await shot('05-reconocer-invitado');

await page.getByRole('tab', { name: /Colección/ }).click();
await page.getByText('Tus descubrimientos temporales').waitFor();
await shot('06-coleccion-vacia');

await page.getByRole('tab', { name: /Progreso/ }).click();
await page.getByText('Tu avance durante esta sesión de invitado').waitFor();
await shot('07-progreso-invitado');

await page.getByRole('tab', { name: /Perfil/ }).click();
await page.getByRole('button', { name: 'Cerrar sesión de invitado' }).waitFor();
await shot('08-perfil-invitado');

const adminContext = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  locale: 'es-CL',
});
const adminPage = await adminContext.newPage();
adminPage.setDefaultTimeout(90_000);
const adminShot = async (name) => {
  await adminPage.waitForTimeout(700);
  await adminPage.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`saved ${name}.png`);
};

await adminPage.goto(BASE, { waitUntil: 'networkidle' });
await adminPage.getByText('Iniciar sesión').first().click();
await adminPage.getByText('Accede para conservar tu colección y tus logros.').waitFor();
await adminShot('09-iniciar-sesion');

await adminPage.getByRole('link', { name: 'Ir a crear una cuenta' }).click({ force: true });
await adminPage.getByText('Guarda tus rocas, logros y todo tu progreso.').waitFor();
await adminShot('10-registro');

await adminPage.getByRole('link', { name: 'Ir a iniciar sesión' }).click({ force: true });
await adminPage.getByText('Accede para conservar tu colección y tus logros.').waitFor();
await adminPage.getByLabel('Correo electrónico').fill(ADMIN_EMAIL);
await adminPage.getByRole('textbox', { name: 'Contraseña' }).fill(ADMIN_PASSWORD);
await adminPage.getByText('Iniciar sesión', { exact: true }).last().click();
await adminPage.getByText('Hola, admin').waitFor();
await adminPage.getByRole('button', { name: 'Administración' }).click();
await adminPage.getByText('Gestiona usuarios, catálogo y actividad').waitFor();
await adminShot('11-admin-resumen');

await adminPage.getByRole('button', { name: 'Usuarios' }).click();
await adminPage.getByLabel('Buscar usuarios').waitFor();
await adminShot('12-admin-usuarios');

await adminPage.goBack();
await adminPage.getByRole('button', { name: 'Rocas' }).click();
await adminPage.getByText('Nueva roca', { exact: true }).waitFor();
await adminShot('13-admin-rocas');

await adminPage.goBack();
await adminPage.getByRole('button', { name: 'Tipos' }).click();
await adminPage.getByText('Los tipos agrupan rocas por su origen geológico.').waitFor();
await adminShot('14-admin-tipos');

await adminPage.goBack();
await adminPage.getByRole('button', { name: 'Categorías' }).click();
await adminPage.getByText('Las categorías clasifican las rocas del catálogo.').waitFor();
await adminShot('15-admin-categorias');

await adminPage.goBack();
await adminPage.getByRole('button', { name: 'Logros' }).click();
await adminPage.getByText('Nuevo logro', { exact: true }).waitFor();
await adminShot('16-admin-logros');

await adminPage.goBack();
await adminPage.getByRole('button', { name: 'Reconocimientos' }).click();
await adminPage.getByText('Filtros', { exact: true }).waitFor();
await adminShot('17-admin-reconocimientos');

await adminPage.goBack();
await adminPage.getByRole('button', { name: 'Retroalimentación' }).click();
await adminPage.getByText('Filtros', { exact: true }).waitFor();
await adminShot('18-admin-evaluaciones');

await browser.close();
