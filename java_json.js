(function() {
    let DMJavaJSONExportAction,
        DMJavaJSONCreditSetting,
        downloadURL = "https://bug.swdteam.com/dm_java_json.js";

    // Fetches latest file & compares versions
    function checkVersion(version, fetchURL, title, path) {
        if (!path.includes("http"))
            fetch(fetchURL)
            .then(response => {
                response.text().then(data => {
                    // Get versions
                    let newVersion =
                        Number(data.match(/(?<=version\s*:).+/)[0].match(/(?<=('|")).+(?=('|"))/)[0].replaceAll(".", "")),
                        currentVersion = version.replaceAll(".", "");
                    // Compare versions
                    if (newVersion && newVersion > currentVersion) {
                        fs.writeFile(path, data, (err) => {
                            if (err) throw err;
                        });
                        Blockbench.showMessageBox({
                            title: `${title} Update!`,
                            message: `The plugin, ${title}, has updated! Would you like to restart to apply the changes?`,
                            buttons: ["Yes", "No"]
                        }, function(result) {
                            if (result == 0)
                                Blockbench.reload();
                        });
                    };
                });
            }).catch(err => {
                throw err;
            });
    };

    Plugin.register("dm_java_json", {
        title: "Dalek Mod JSON Format",
        author: "Bug1312",
        icon: Blockbench.getIconNode("icon-format_java"),
        description: "Imports and Exports Dalek Mod's model format",
        about: "To export you must be in modded entity format",
<<<<<<< HEAD:dm_java_json.js
        version: "0.7.7",
=======
        version: "1.7.7",
>>>>>>> main:java_json.js
        variant: "both",
        min_version: "4.0.0",
        tags: ["Dalek Mod"],
        onload() {
            // If on Mobile, warn user
            if (Blockbench.isMobile == true)
                Blockbench.showMessageBox({
                    title: "Mobile Warning",
                    message: "This device has been identified as a Mobile Device\n\n Due to this, the plugin may not work."
                });
            // Create export button
            DMJavaJSONExportAction = new Action({
                id: "DMJavaJSON",
                name: "Export Dalek Mod JSON",
                icon: Blockbench.getIconNode("fas.fa-file-download"),
                description: "Exports your entity model as a DM JSON file",
                category: "file",
                condition: () => (Project && Project.format) ? (Project.format.id == Formats.modded_entity.id) : false,
                click: function() {
                    javaJsonCodec.export();
                }
            });
            MenuBar.addAction(DMJavaJSONExportAction, "file.export");
            // Create Credits Setting
            DMJavaJSONCreditSetting = new Setting("dm_credits", {
                name: "Dalek Mod JSON Comments",
                description: "Adds comment to Dalek Mod JSON files"
            });
            // Check version and update
            setTimeout(() => {
                checkVersion(this.version, downloadURL, this.title, this.path);
            }, 500);
        },
        onunload() {
            // Remove export button
            DMJavaJSONExportAction.delete();
        },
        onuninstall() {
            // Remove credit setting; In uninstall so setting doesn't reset after relaunch
            DMJavaJSONCreditSetting.delete();
        }
    });

    // Converts integer to floating-point decimal
    function F(num) {
        return parseFloat(num.toFixed(4));
    };

    let codecId = "dm_java_json";
    let javaJsonCodec = new Codec(codecId, {
        name: "Dalek Mod JavaJSON",
        extension: "json",
        remember: true,
        export_action: DMJavaJSONExportAction,
        load_filter: {
            type: "json",
            extensions: ["json"],
            condition(model) {
                return (model.groups && model.texture_width); // If JSON is actually a JavaJSON file
            }
        },
        parse(model, path) {
            // Update Project Settings
            Project.texture_width = model.texture_width;
            Project.texture_height = model.texture_height;
            Project.format.codec = Codecs[codecId];
            Project.scale = Number(model.scale);
            Project.alphamap = (model.alphamap != undefined) ? true : false;
            Project.save_path = path;
            Project.select();

            // Adds Model
            {

                //Runs through all textures
                {
                    let textureArray = [];

                    if (model.texture) textureArray.push(model.texture);
                    if (model.lightmap) textureArray.push(model.lightmap);
                    if (model.alphamap && model.alphamap != "generated") textureArray.push(model.alphamap);

                    textureArray.forEach(tex => {
                        let pathArray = path.split(osfs),
                            newTex = new Texture({
                                id: tex
                            });

                        pathArray.splice((pathArray.indexOf("assets") + 2) - pathArray.length);
                        newTex.fromJavaLink(tex, pathArray);
                        newTex.folder = pathArray.splice(pathArray.indexOf(newTex.namespace) + 2).join("/").replace(/\/[^/]+$/g, "");
                        newTex.render_mode = "layered";
                        newTex.add();
                    });

                    Texture.all[0].select();
                    if (Texture.all.filter(tex => tex.name.toLowerCase().includes("alphamap")).length) Texture.all.filter(tex => tex.name.toLowerCase().includes("alphamap"))[0].visible = false;
                }

                // Run through all groups and their cubes
                model.groups.forEach(group => {
                    // Groups
                    function groupFunc(group, parent) {
                        let origin = parent ? [
                                parent.origin[0] - group.pivot[0],
                                parent.origin[1] - group.pivot[1],
                                parent.origin[2] + group.pivot[2]
                            ] : [
                                -group.pivot[0],
                                24 - group.pivot[1],
                                group.pivot[2]
                            ],
                            newgroup = new Group({
                                name: group.group_name,
                                origin,
                                rotation: [-group.rotation[0], group.rotation[1], group.rotation[2]]
                            });

                        if (!newgroup.rotation.every(item => item == 0) && !group.group_name)
                            group.cubes.forEach(cube => cubeFunc(cube, parent, origin, newgroup.rotation));
                        else if (!group.group_name)
                            group.cubes.forEach(cube => cubeFunc(cube, undefined, origin));
                        else {
                            if (parent)
                                newgroup.addTo(parent).init();
                            else
                                newgroup.init();

                            if (group.children && group.children.length)
                                group.children.forEach(group => groupFunc(group, newgroup));

                            if (group.cubes && group.cubes.length)
                                group.cubes.forEach(cube => cubeFunc(cube, newgroup, origin));
                        };
                    };

                    // Cubes
                    function cubeFunc(cube, parent, origin, rotation) {
                        let newCube = new Cube({
                            to: parent ? [
                                parent.origin[0] - cube.origin[0],
                                parent.origin[1] - cube.origin[1],
                                parent.origin[2] + cube.origin[2] + cube.size[2]
                            ] : [
                                -cube.origin[0],
                                -cube.origin[1],
                                cube.origin[2] + cube.size[2]
                            ],
                            from: parent ? [
                                parent.origin[0] - cube.origin[0] - cube.size[0],
                                parent.origin[1] - cube.origin[1] - cube.size[1],
                                parent.origin[2] + cube.origin[2]
                            ] : [
                                -cube.origin[0] - cube.size[0],
                                -cube.origin[1] - cube.size[1],
                                cube.origin[2]
                            ],
                            origin,
                            uv_offset: cube.uv,
                            inflate: cube.inflate,
                            mirror_uv: cube.mirror,
                            rotation: rotation
                        });

                        newCube.addTo(parent);
                        newCube.init();
                        if (rotation) {
                            newCube.select();
                            for (axis = 0; axis < 3; axis++)
                                moveElementsInSpace(newCube.origin[axis], axis);
                        };
                    };

                    groupFunc(group);
                });
            }

            unselectAll();
        },
        compile() {
            let model = {
                    "credit": settings.credit.value,
                    "texture": "",
                    "lightmap": "",
                    "alphamap": "",
                    "texture_width": Project.texture_width,
                    "texture_height": Project.texture_height,
                    "scale": (Project.scale === undefined) ? 1 : Number(Project.scale),
                    "groups": []
                },
                placeholderArray = [{
                    "uuid": "root",
                    "pivot": [0, 24, 0],
                    "rotation": [0, 0, 0],
                    "children": [],
                    "cubes": []
                }],
                pastSelection = [].concat(selected);
            // Removes credit based on setting
            if (!settings.dm_credits)
                delete model.credit;
            // Set Textures
            if (Cube.all.length > 0) {
                // Helper function for getting texture path
                function getPath(name, folder, namespace = "dalekmod") {
                    let newName = name.replace(/\.[^\.]+$/, "");

                    // If folder is not defined, remove folder directory path
                    if (folder != undefined && folder != "")
                        return `${namespace}:${folder}/${newName}`;
                    else return `${namespace}:${newName}`;
                };

                // Add in file paths
                Texture.all.forEach(texture => {
                    let pathArray = texture.path.split(osfs);

                    pathArray.splice(-(pathArray.length - pathArray.indexOf("assets") - 2));
                    texture.namespace = pathArray.pop();
                    pathArray = texture.path.split(osfs);
                    texture.folder = pathArray.splice(pathArray.indexOf(texture.namespace) + 2).join("/").replace(/\/[^/]+$/g, "");
                });
                let tex = Cube.all.random().faces.north.getTexture();

                model.texture = (tex) ? getPath(tex.name, tex.folder, tex.namespace) : "null";

                // If texture file with "lightmap" in the name (case-insensitive), add a light map
                if (Texture.all.find(tex => tex.name.toLowerCase().includes("lightmap"))) {
                    let lightMapTex = Texture.all.find(tex => tex.name.toLowerCase().includes("lightmap"));
                    model.lightmap = getPath(lightMapTex.name, lightMapTex.folder, lightMapTex.namespace);
                } else delete model.lightmap;

                // If model has alphamap, choose to generate or use provided texture with "alphamap" in the name (case-insensitive)
                if (Project.alphamap) {
                    if (Texture.all.find(tex => tex.name.toLowerCase().includes("alphamap"))) {
                        let alphaMapTex = Texture.all.find(tex => tex.name.toLowerCase().includes("alphamap"));
                        model.alphamap = getPath(alphaMapTex.name, alphaMapTex.folder, alphaMapTex.namespace);
                    } else {
                        model.alphamap = "generated";
                    }
                } else delete model.alphamap;
            }

            // Set Model 
            {
                // Add groups to model object
                for (let i = 0; i < Group.all.length; i++) {
                    let group = Group.all[i],
                        object = {
                            "uuid": group.uuid,
                            "group_name": group.name,
                            "pivot": [-F(group.origin[0]), F(24 - group.origin[1]), F(group.origin[2])],
                            "rotation": [-F(group.rotation[0]), F(group.rotation[1]), F(group.rotation[2])],
                            "children": [],
                            "cubes": []
                        };

                    if (group.parent != "root") {
                        object.pivot = [-F(group.origin[0] - group.parent.origin[0]), -F(group.origin[1] - group.parent.origin[1]), F(group.origin[2] - group.parent.origin[2])];
                        object.boneParent = group.parent.uuid;
                    };
                    placeholderArray.push(object);
                };
                // Adds cubes to model object
                for (let i = 0; i < Cube.all.length; i++) {
                    let cube = Cube.all[i];

                    if (cube.rotation[0] != 0 || cube.rotation[1] != 0 || cube.rotation[2] != 0) { // If cube has rotation
                        // Move cube
                        cube.select();
                        for (axis = 0; axis < 3; axis++)
                            moveElementsInSpace(-cube.origin[axis], axis);
                        let object = {
                            "pivot": [-F(cube.origin[0]), F(24 - cube.origin[1]), F(cube.origin[2])],
                            "rotation": [-F(cube.rotation[0]), F(cube.rotation[1]), F(cube.rotation[2])],
                            "children": [],
                            "cubes": [{
                                "uv": cube.uv_offset,
                                "size": [F(cube.size(0, true)), F(cube.size(1, true)), F(cube.size(2, true))],
                                "origin": [-F(cube.to[0]), -F(cube.to[1]), F(cube.from[2])],
                                "inflate": F(cube.inflate),
                                "mirror": cube.mirror_uv,
                            }]
                        };

                        if (cube.parent != "root") {
                            object.pivot = [
                                F(cube.parent.origin[0] - cube.origin[0]),
                                F(cube.parent.origin[1] - cube.origin[1]),
                                F(cube.origin[2] - cube.parent.origin[2])
                            ];
                            placeholderArray.find(bone => bone.uuid == cube.parent.uuid).children.push(object);
                        } else {
                            placeholderArray.push(object);
                        };
                        // Place cube back
                        for (axis = 0; axis < 3; axis++)
                            moveElementsInSpace(cube.origin[axis], axis);
                    } else { // If cube doesn"t have rotation
                        let object = {
                                "uv": cube.uv_offset,
                                "size": [F(cube.size(0, true)), F(cube.size(1, true)), F(cube.size(2, true))],
                                "origin": [-F(cube.to[0]), -F(cube.to[1]), F(cube.from[2])],
                                "inflate": F(cube.inflate),
                                "mirror": cube.mirror_uv,
                            },
                            parent = (cube.parent.uuid) ? cube.parent.uuid : "root";

                        if (cube.parent != "root") {
                            object.origin = [
                                F(cube.parent.origin[0] - cube.to[0]),
                                F(cube.parent.origin[1] - cube.to[1]),
                                F(cube.from[2] - cube.parent.origin[2])
                            ];
                        };
                        placeholderArray.find(bone => bone.uuid == parent).cubes.push(object);
                    };
                };
                // Add each child to their respective parent
                for (let i = placeholderArray.filter(bone => bone.boneParent != undefined).length - 1; i >= 0; i--) {
                    let object = placeholderArray.filter(bone => bone.boneParent != undefined)[i],
                        uuid = object.boneParent.toString();

                    // Delete values we won't have access to later
                    delete object.boneParent; // Removes bone parent
                    delete object.uuid; // Removes uuid
                    if (object.children.length == 0) delete object.children; // Removes child array if empty
                    if (object.cubes.length == 0) delete object.cubes; // Removes cube array if empty

                    placeholderArray.filter(element => element.uuid == uuid)[0].children.push(object);
                    placeholderArray.splice(placeholderArray.findIndex(element => element == object), 1);
                };
                // If there are no cubes in root, delete root (saves space)
                if (!placeholderArray[0].cubes.length)
                    placeholderArray.splice(0, 1);
                // Removes groups' unneeded data
                for (i = 0; i < placeholderArray.length; i++) {
                    let group = placeholderArray[i];
                    delete group.uuid;
                    if (group.children.length == 0) delete group.children;
                    if (group.cubes.length == 0) delete group.cubes;
                }
                // Sets object data to array
                model.groups = placeholderArray;
            }

            // Resets selection
            unselectAll();
            pastSelection.forEach(element => element.select({
                shiftKey: true
            }));

            return JSON.stringify(model, (key, value) => {
                // Make arrays (apart from groups, cubes, and children) inline
                if (value instanceof Array && !(key == "groups" || key == "cubes" || key == "children"))
                    return JSON.stringify(value);
                return value;
            }, "\t").replace(/((?<=\])"|"(?=\[))/g, "");
        },
        export () {
            // Displays and sets scale
            new Dialog("JavaJsonExport", {
                title: "Export as JavaJSON",
                lines: [
                    "<p> Model Scale (if you don't know what this is, leave at 1) </p>",
                    `<div class="dialog_bar" style="height: 32px;">
                    <input type="range" id="model_scale_range" value="${(Project.scale === undefined)? 1 : Project.scale}" min="0" max="4" step="0.02" oninput="modelScaleSyncDM();">
                    <input type="number" class="f_left dark_bordered" id="model_scale_label" min="0" max="4" step="0.02" value="${(Project.scale === undefined)? 1 : Project.scale}" oninput="modelScaleSyncDM(true)">
                    </div><br />`
                ],
                form: {
                    alpha: {
                        type: "checkbox",
                        label: "Is this a TARDIS?",
                        nocolon: true
                    }
                },
                onConfirm: function(formData) {
                    // Set scale
                    Project.scale = Number(document.querySelectorAll("#model_scale_range")[1].value);
                    // Sets if alpha map is used
                    Project.alphamap = formData.alpha;

                    // Exports file
                    Blockbench.export({
                        type: "JSON",
                        extensions: ["json"],
                        savetype: "text",
                        startpath: Project.save_path,
                        content: Codecs[codecId].compile(),
                        name: Project.name
                    }, (path) => {
                        // Save Project as recent
                        addRecentProject({
                            name: Project.name,
                            path: path,
                            icon: Format.icon
                        });
                        // Sets Project's save & export path
                        Project.save_path = path;
                        Project.export_path = path;
                    });

                    Project.format.codec = Codecs[codecId];

                }
            }).show();
        }
    });

    // Sets format; Codec class does not have ability to set format through param 2
    javaJsonCodec.format = Formats.modded_entity;

})();

// Function to update slider; Must be outside main function to be avaliable
function modelScaleSyncDM(label) {
    if (label) {
        let size = document.querySelectorAll("#model_scale_label")[1].value;
        document.querySelectorAll("#model_scale_range")[1].value = size;
    } else {
        let size = document.querySelectorAll("#model_scale_range")[1].value;
        document.querySelectorAll("#model_scale_label")[1].value = size;
    };
};