let latest = false

function updateAllVersButton() {
    let button = document.getElementById("button_all_versions"),
        folded = document.getElementById("all_versions").getAttribute("folded");
    if (folded == "true") button.innerHTML = "+ Show All Versions";
    else button.innerHTML = "- Hide All Versions";
}

function addVersion(version, date, changelogURL) {
    let name = 'javajson';
    if (/^v0\.7\.\d$/.test(version)) name = 'dm_java_json'

    if (!latest) {
        document.getElementById("latest_version-version").innerHTML = version;
        document.getElementById("latest_version-release").innerHTML = date;
        document.getElementById("latest_version-changelog").setAttribute("href", changelogURL);
        latest = true
    }
    
    document.getElementById("all_versions").innerHTML += `
    <div class="version">
        <span class="version-version">${version}</span>
        <span class="version-time">${date}</span>
        <a class="version-file version-underline" href="https://github.com/${repo}/releases/download/${version}/${name}.js" download="${name}.js"> <i class="bi bi-file-earmark-arrow-down"></i> File </a>
        <div class="tooltip" style="width:initial;">
            <span class="tooltiptext version-copy-tooltip">
                Copy to clipboard
            </span>
            <a class="version-url version-underline" onclick="copy('version_${version}-url-copy')" onmouseleave="resetCopyTooltip()"> <i class="bi bi-link-45deg"></i> URL </a>
            <input id="version_${version}-url-copy" type="text" value="https://github.com/${repo}/releases/download/${version}/${name}.js" readonly hidden>
        </div>
        <a class="version-changelog version-underline" href="${changelogURL}"> <i class="bi bi-file-earmark-text"></i> Changelog </a>
    </div>`;
}


let repo = "Bug1312/JavaJSON";
fetch(`https://api.github.com/repos/${repo}/releases`)
    .then(response => {
        return response.json();
    })
    .then(json => {
        json.forEach((release, index) => {
            addVersion(
                release.tag_name,
                timeDifference(new Date(release.published_at)),
                `https://github.com/${repo}/releases/tag/${release.tag_name}`
            )
        })
    })
    .catch(err => {
        throw err
    });