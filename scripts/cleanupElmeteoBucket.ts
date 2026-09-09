import { cleanupElmeteoBucket, ELMETEO_RETENTION_WEEKS } from "@/lib/elmeteo";

// Elimina dal bucket S3 di ElMeteo le cartelle piu' vecchie di
// ELMETEO_RETENTION_WEEKS settimane. Lo stesso cleanup gira automaticamente
// dopo ogni POST su /api/elmeteo.
async function main() {
	console.log(
		`🧹 Cleanup bucket ElMeteo (retention: ${ELMETEO_RETENTION_WEEKS} settimane)...`,
	);
	const result = await cleanupElmeteoBucket();
	console.log(`📦 Bucket: ${result.bucket}`);
	console.log(`📁 Cartelle presenti: ${result.totalFolders}`);
	console.log(`🗑️  Cartelle eliminate: ${result.deletedFolders.length}`);
	for (const folder of result.deletedFolders) {
		console.log(`   - ${folder}`);
	}
	console.log(`🗑️  Oggetti eliminati: ${result.deletedObjects}`);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
