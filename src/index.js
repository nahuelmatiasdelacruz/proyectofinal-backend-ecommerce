const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;
const {Router} = express;
const fs = require("fs");
let administrador = true;

// Seteos de la APP
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(express.static("public"));

// Rutas
const routerProductos = Router();
app.use("/api/productos",routerProductos);
const routerCarrito = Router();
app.use("/api/carrito",routerCarrito);
// Ruta invalida
app.use("*",(req,res)=>{
    res.status(404).send("La ruta a la que intentas acceder, no existe!");
})

app.listen(PORT,()=>{
    console.log("Server listening on port " + PORT);
})

// Funciones - REST Productos

const getAll = async (filePathName)=>{
    try{
        const data = await fs.promises.readFile(filePathName, "utf-8");
        try{
            const jsonObjs = JSON.parse(data);
            return jsonObjs;
        }catch(e){
            return [];
        }
    }catch(e){
        return e.message;
    }
}
const getById = async (id,filePathName)=>{
    try{
        const data = await getAll(filePathName);
        const item = data.filter(item=>item.id===parseInt(id));
        if(item.length > 0){
            return item[0];
        }else{
            return {error: "Item no encontrado"};
        }
    }catch(e){
        return {error: "Hubo un error leyendo la base de productos"}
    }
}
const saveProduct = async (data) => {
    let objetosRecibidos = await getAll("./data/productos.txt");
    if(objetosRecibidos.length === 0){
        try{
            const aux = {
                id: 1,
                timestamp: Date.now(),
                nombre: data.nombre,
                descripcion: data.descripcion,
                codigo: data.codigo,
                thumbnail: data.thumbnail,
                precio: data.precio,
                stock: data.stock
            }
            objetosRecibidos.push(aux);
            await fs.promises.writeFile("./data/productos.txt",JSON.stringify(objetosRecibidos));
            return true;
        }catch(e){
            console.log("Hubo un error al guardar el objeto");
            return false;
        }
    }else{
        try{
            const newId = objetosRecibidos[objetosRecibidos.length - 1].id+1;
            const aux = {
                id: newId,
                timestamp: Date.now(),
                nombre: data.nombre,
                descripcion: data.descripcion,
                codigo: data.codigo,
                thumbnail: data.thumbnail,
                precio: data.precio,
                stock: data.stock
            }
            objetosRecibidos.push(aux);
            await fs.promises.writeFile("./data/productos.txt",JSON.stringify(objetosRecibidos));
            return true;
        }catch(e){
            console.log("Hubo un error al guardar el objeto");
            return false;
        }
    }
}
const editProduct = async (data) => {
    let products = await getAll("./data/productos.txt");
    if(products.length < 0){
        return false;
    }else{
        let index = products.findIndex(p=>p.id === data.id);
        products[index].timestamp = Date.now();
        products[index].nombre = data.nombre;
        products[index].descripcion = data.descripcion;
        products[index].codigo = data.codigo;
        products[index].thumbnail = data.thumbnail;
        products[index].precio = data.precio;
        products[index].stock = data.stock;
        await fs.promises.writeFile("./data/productos.txt",JSON.stringify(products));
        return true;
    }
}
const deleteItem = async (id,filePathName) => {
    try{
        const items = await getAll(filePathName);
        const newitems = items.filter(item=>item.id!==id);
        await fs.promises.writeFile(filePathName,JSON.stringify(newitems));
        return true;
    }catch(e){
        return false;
    }
}

// Funciones - REST Carrito
const addProductCarrito = async (data)=>{
    let productosEnCarrito = await getAll("./data/carrito.txt");
    if(productosEnCarrito.length === 0){
        try{
            const aux = {
                id: 1,
                timestamp: Date.now(),
                productos: data
            }
            productosEnCarrito.push(aux);
            await fs.promises.writeFile("./data/carrito.txt",JSON.stringify(productosEnCarrito));
            return true;
        }catch(e){
            console.log("Hubo un error al guardar el objeto en el carrito");
            return false;
        }
    }else{
        try{
            const newId = productosEnCarrito[productosEnCarrito.length - 1].id+1;
            const aux = {
                id: newId,
                timestamp: Date.now(),
                productos: data
            }
            productosEnCarrito.push(aux);
            await fs.promises.writeFile("./data/carrito.txt",JSON.stringify(productosEnCarrito));
            return true;
        }catch(e){
            console.log("Hubo un error al guardar el objeto en el carrito");
            return false;
        }
    }
}

//REST Productos
routerProductos.get("/:id?", async (req, res) => {
    if(req.params.id===undefined){
        const productos = await getAll("./data/productos.txt");
        res.send(productos);
    }else{
        const producto = await getById(req.params.id,"./data/productos.txt");
        res.send(producto);
    }
});
routerProductos.post("/", async (req, res) => {
    if(!administrador){
        res.json({error: -1, descripcion: "Ruta / metodo POST no autorizado"});
    }else{
        const data = {
            nombre: req.body.nombre,
            descripcion: req.body.descripcion,
            codigo: req.body.codigo,
            thumbnail: req.body.thumbnail,
            precio: parseInt(req.body.precio),
            stock: parseInt(req.body.stock)
        }
        const result = await saveProduct(data);
        if(result){
            res.json({success: "Se ha escrito el archivo en la base de datos"});
        }else{
            res.json({error: "Hubo un error al escribir el archivo en la base de datos"});
        }
    }
});
routerProductos.put("/:id", async (req, res) => {
    if(!administrador){
        res.json({error: -1, descripcion: "Ruta /:id metodo PUT no autorizado"});
    }else{
        const data = {
            id: parseInt(req.params.id),
            nombre: req.body.nombre,
            descripcion: req.body.descripcion,
            codigo: req.body.codigo,
            thumbnail: req.body.thumbnail,
            precio: parseInt(req.body.precio),
            stock: parseInt(req.body.stock)
        }
        const result = await editProduct(data);
        if(result){
            res.json({success: "Se ha editado el producto correctamente"});
        }else{
            res.json({error: "Hubo un error al editar el producto"});
        }
    }
});
routerProductos.delete("/:id", async (req, res) => {
    if(!administrador){
        res.json({error: -1, descripcion: "Ruta /:id metodo DELETE no autorizado"});
    }else{
        const result = await deleteItem(parseInt(req.params.id),"./data/productos.txt");
        if(result){
            res.send({success: "Se ha borrado el producto correctamente"});
        }else{
            res.send({error: "Hubo un error al borrar el producto"});
        }
    }
});

//REST Carrito
routerCarrito.post("/", async (req, res) => {
    const result = await addProductCarrito(req.body);
    if(result){
        res.send({success: "Se ha agregado los productos al carrito"});
    }else{
        res.send({error: "No se pudo agregar los productos al carrito"});
    }
});
routerCarrito.delete("/:id", async (req, res) => {
    const result = await deleteItem(parseInt(req.params.id),"./data/carrito.txt");
    if(result){
        res.send({success: "Se ha borrado el carrito correctamente"});
    }else{
        res.send({error: "Hubo un error al borrar el carrito"});
    }
});
routerCarrito.get("/:id/productos", async (req, res) => {
    const data = await getById(req.params.id,"./data/carrito.txt");
    if(data.error){
        res.send(data);
    }else{
        res.send(data.productos);
    }
});
routerCarrito.post("/:id/productos", async (req, res) => {
    let carrito = await getAll("./data/carrito.txt");
    let index = carrito.findIndex(item=>item.id === parseInt(req.params.id));
    carrito[index].productos.push(req.body);
    try{
        await fs.promises.writeFile("./data/carrito.txt",JSON.stringify(carrito));
        res.send({success: "Completed!"});
    }catch(e){
        console.log(e);
        res.send({error: "Error!"});
    }
});
routerCarrito.delete("/:id/productos/:id_prod", async(req, res) => {
    let carrito = await getAll("./data/carrito.txt");
    let index = carrito.findIndex(item=>item.id === parseInt(req.params.id));
    const newProducts = carrito[index].productos.filter(item=>item.id!==parseInt(req.params.id_prod));
    carrito[index].productos = newProducts;
    try{
        await fs.promises.writeFile("./data/carrito.txt",JSON.stringify(carrito));
        res.send({success: "Completed!"});
    }catch(e){
        console.log(e);
        res.send({error: "Error!"});
    }
});
