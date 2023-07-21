(function() {
    let JavaJSONExportAction, JavaJSONCreditSetting;
    const downloadURL = "https://javajson.bug1312.com/latest";
  
    // Fetches latest file & compares versions
    function checkVersion(version, fetchURL, title, id, path) {
        if (!path.includes("http"))
            fetch(fetchURL)
            .then(response => {
                response.text().then(data => {
                    // Make sure the filename is in-sync with the ID
                    if (id !== "latest") data = data.replace('Plugin.register("latest"', `Plugin.register("${id}"`);

                    // Get versions
                    const newVersionString = data.match(/(?<=version\s*:).+/)[0].match(/(?<=('|")).+(?=('|"))/)[0],
                        newVersion = Number(newVersionString.replaceAll(".", "")),
                        currentVersion = version.replaceAll(".", "");

                    // Compare versions
                    if (newVersion && newVersion > currentVersion) {
                        fs.writeFile(path, data, (err) => { if (err) throw err; });
                        Plugins.all.find(p => p.id === id)?.reload();
                        Blockbench.showQuickMessage(`${title} has updated to ${newVersionString}!`);
                    };
                });
            }).catch(err => { throw err; });
    };
  
    Plugin.register("javajson", {
        title: "JavaJSON",
        author: "Bug1312",
        icon: Blockbench.getIconNode("icon-format_java"),
        description: "Imports and Exports in the JavaJSON model format",
        about: "To export you must be in modded entity format",
        version: "0.9.0",
        variant: "both",
        min_version: "4.0.0",
        onload() {
            // Create export button
            JavaJSONExportAction = new Action({
                id: "JavaJSON",
                name: "Export JavaJSON",
                icon: Blockbench.getIconNode("fas.fa-file-download"),
                description: "Exports your entity model as a JavaJSON file",
                category: "file",
                condition: () => (Project && Project.format) ? (Project.format.id == Formats.modded_entity.id) : false,
                click: () => javaJsonCodec.export()
            });
            MenuBar.addAction(JavaJSONExportAction, "file.export");
            // Create Credits Setting
            JavaJSONCreditSetting = new Setting("javajson_credits", {
                name: "JavaJSON Comments",
                description: "Adds comment to JavaJSON files"
            });
            // Check version and update
            setTimeout(() => {
                checkVersion(this.version, downloadURL, this.title, this.id, this.path);
            }, 500);
        },
        onunload() {
            // Remove export button
            JavaJSONExportAction.delete();
        },
        onuninstall() {
            // Remove credit setting; In uninstall so setting doesn't reset after relaunch
            JavaJSONCreditSetting.delete();
        }
    });
  
    // Converts integer to floating-point decimal
    function F(num) {
        return parseFloat(num.toFixed(4));
    };
  
    const codecId = "javajson";
    let javaJsonCodec = new Codec(codecId, {
        name: "JavaJSON",
        extension: "json",
        remember: true,
        export_action: JavaJSONExportAction,
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
            Project.java_json__scale = Number(model.scale);
            Project.save_path = path;
            Project.export_path = path;
            Project.select();
  
            // Get textures
            const textureArray = [];
            if (model.texture) textureArray.push(model.texture);
            
            for (key in model) {
                if (key == "alphamap" && model.alphamap == "generated") continue; // Deprecated
                if (/map$/i.test(key)) // then it's a map
                    textureArray.push(model[key]);
            }

            textureArray.forEach(tex => {
                const pathArray = path.split(osfs),
                    newTex = new Texture({ id: tex });

                pathArray.splice((pathArray.indexOf("assets") + 2) - pathArray.length);
                newTex.fromJavaLink(tex, pathArray);
                newTex.folder = pathArray.splice(pathArray.indexOf(newTex.namespace) + 2).join("/").replace(/\/[^/]+$/g, "");
                newTex.render_mode = "layered";
                newTex.visible = false;
                newTex.add();
            });

            Texture.all[0]?.select();
            if (Texture.all[0]) Texture.all[0].visible = true;

            function groupFunc(group, parent) {
                const newgroup = new Group({
                    name: group.group_name,
                    origin: parent ? [
                        parent.origin[0] - group.pivot[0],
                        parent.origin[1] - group.pivot[1],
                        parent.origin[2] + group.pivot[2]
                    ] : [
                        -group.pivot[0],
                        24 - group.pivot[1],
                        group.pivot[2]
                    ],
                    rotation: [-group.rotation[0], group.rotation[1], group.rotation[2]]
                });
            
                newgroup.addTo(parent).init();

                group.cubes?.forEach(cube => cubeFunc(cube, newgroup));

                if (!group.group_name) newgroup.resolve();
                else group.children?.forEach(group => groupFunc(group, newgroup));
            }

            function cubeFunc(cube, parent) {
                const newCube = new Cube({
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
                    origin: parent?.origin ?? [0, 0, 0],
                    uv_offset: cube.uv,
                    inflate: cube.inflate,
                    mirror_uv: cube.mirror,
                });

                newCube.addTo(parent);
                newCube.init();
            }

            // Run through all groups and their cubes
            model.groups.forEach(group => groupFunc(group, null));    
            
            unselectAll();
        },
        compile() {
            const model = {
                    "credit": settings.credit.value,
                    "texture": "",
                    // ...maps
                    // texture_width
                    // texture_height
                    // scale
                    // groups
                },
                placeholderArray = [{
                    "uuid": "root",
                    "pivot": [0, 24, 0],
                    "rotation": [0, 0, 0],
                    "children": [],
                    "cubes": []
                }],
                pastSelection = [...selected];

            // Removes credit based on settings
            if (!settings.javajson_credits || !settings.credit.value) delete model.credit;

            // Set Textures
            if (Cube.all.length > 0) { 
                // Add in file paths
                Texture.all.forEach(texture => {
                    let pathArray = texture.path.split(osfs);
  
                    pathArray.splice(-(pathArray.length - pathArray.indexOf("assets") - 2));
                    texture.namespace = pathArray.pop();
                    pathArray = texture.path.split(osfs);
                    texture.folder = pathArray.splice(pathArray.indexOf(texture.namespace) + 2).join("/").replace(/\/[^/]+$/g, "");
                });
                const tex = Cube.all.random().faces.north.getTexture();
  
                model.texture = tex?.javaTextureLink() ?? "";
  
                // If texture file with "_<name>map" in the name (case-insensitive), add the map
                const textureMaps = Texture.all.filter(tex => /_[^_]+map/i.test(tex.name));
                
                for (const tex of textureMaps) {
                  const mapName = tex.name.toLowerCase().match(/(?<=_)[^_]+map/)[0];
                  model[mapName] = tex.javaTextureLink();
                }
            }
  
            // Add other values after the textures
            model.texture_width = Project.texture_width;
            model.texture_height = Project.texture_height;
            model.scale = (Project.java_json__scale === undefined) ? 1 : Number(Project.java_json__scale);
            model.groups = [];
  
            // Add groups to model object
            for (let i = 0; i < Group.all.length; i++) {
                const group = Group.all[i],
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
                const cube = Cube.all[i];

                if (!cube.rotation.every(r => r === 0)) { // If cube has rotation
                    // Move cube
                    cube.select();
                    const origin = [...cube.origin];
                    for (let axis = 0; axis < 3; axis++) moveElementsInSpace(-cube.origin[axis], axis);
                    
                    const object = {
                        "pivot": [-F(origin[0]), F(24 - origin[1]), F(origin[2])],
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
                    for (let axis = 0; axis < 3; axis++) moveElementsInSpace(origin[axis], axis);
                } else { // If cube doesn"t have rotation
                    const object = {
                            "uv": cube.uv_offset,
                            "size": [F(cube.size(0, true)), F(cube.size(1, true)), F(cube.size(2, true))],
                            "origin": [-F(cube.to[0]), -F(cube.to[1]), F(cube.from[2])],
                            "inflate": F(cube.inflate),
                            "mirror": cube.mirror_uv,
                        },
                        parent = (cube.parent?.uuid) ?? "root";

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
                const object = placeholderArray.filter(bone => bone.boneParent != undefined)[i],
                    uuid = object.boneParent.toString();

                // Delete values we won't have access to later
                delete object.boneParent; // Removes bone parent
                delete object.uuid; // Removes uuid
                if (!object.children?.length) delete object.children; // Removes child array if empty
                if (!object.cubes?.length) delete object.cubes; // Removes cube array if empty

                placeholderArray.filter(element => element.uuid == uuid)[0].children.push(object);
                placeholderArray.splice(placeholderArray.findIndex(element => element == object), 1);
            };
            
            // If there are no cubes in root, delete root (saves space)
            if (!placeholderArray[0]?.cubes?.length) placeholderArray.splice(0, 1);
            // Removes groups' unneeded data
            for (let i = 0; i < placeholderArray.length; i++) {
                const group = placeholderArray[i];
                delete group.uuid;
                if (!group.children?.length) delete group.children;
                if (!group.cubes?.length) delete group.cubes;
            }
            // Sets object data to array
            model.groups = placeholderArray;
 
            // Resets selection
            unselectAll();
            pastSelection.forEach(element => element.select({
                shiftKey: true
            }));
  
            return JSON.stringify(model, (key, value) => {
                // Make arrays (apart from groups, cubes, and children) inline
                if (value instanceof Array && !(key === "groups" || key === "cubes" || key === "children"))
                    return JSON.stringify(value);
                return value;
            }, "\t").replace(/((?<=\])"|"(?=\[))/g, "");
        },
        export () {
            // Displays and sets scale
            new Dialog("JavaJsonExport", {
                title: "Export as JavaJSON",
                form: {
                    scale: {
                        label: "Model Scale",
                        type: "range",
                        value: Project.java_json__scale ?? 1,
                        max: 4,
                        step: 0.2
                    }
                },
                onConfirm: function(formData) {
                    // Set scale
                    Project.java_json__scale = formData.scale;
  
                    // Exports file
                    Blockbench.export({
                        type: "JSON",
                        extensions: ["json"],
                        savetype: "text",
                        startpath: Project.save_path,
                        content: Codecs[codecId].compile(),
                        name: Project.name
                    }, (path) => Codecs[codecId].afterDownload(path));
  
                    Project.format.codec = Codecs[codecId];
                }
            }).show();
        }
    });
  
    // Sets format; Codec class does not have ability to set format through param 2
    javaJsonCodec.format = Formats.modded_entity;
})();