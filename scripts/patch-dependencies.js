const fs = require("node:fs")

// Pulumi has issues with two packagse that use exports.
// Deleting the exports field from the package.json file fixes this.

function removeExports(packageName) {
  const packageJsonPath = `node_modules/${packageName}/package.json`
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))
  delete packageJson["exports"]
  fs.writeFileSync(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2),
    "utf8"
  )
}

removeExports("@permaweb/aoconnect")
removeExports("@ardrive/turbo-sdk")
