const fs = require('fs-extra');
(async () => {
    try {
        const dest = "dist/resource-library/lib/assets/";
        var source = "projects/resource-library/src/lib/assets";
        const isAssetsExists = await fs.pathExists(dest)

        if (isAssetsExists) {
            await fs.remove(dest);
        }
        await fs.copy(source, dest)
        console.log('Assets copied successfully')
    } catch (err) {
        console.error("Error while copying assets", err)
    }
})();
