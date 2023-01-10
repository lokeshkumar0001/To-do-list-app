const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const favicon = require("serve-favicon");
const _ = require("lodash");
const dotenv = require("dotenv");

const app = express();

app.set("view engine","ejs");
dotenv.config({path: __dirname + "/config.env"});

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
app.use(favicon(__dirname+ "/public/image/favicon.ico"));

mongoose.connect(process.env.mongoDBUrl)

const itemsSchema = new mongoose.Schema({
  name: String
})

const Item = mongoose.model("Item",itemsSchema);

const item1 = new Item({
  name:"welcome to your todolist!!"
})

const item2 = new Item({
  name: "Hit the + to add a new item"
})

const item3 = new Item({
  name: "<-- Hit this to delete a item."
})

const defaultItems = [item1,item2,item3];

const listSchema = mongoose.Schema({
  name:String,
  items:[itemsSchema]
})

const List = mongoose.model("List",listSchema);


app.get("/",function(req,res){

  Item.find({},(err,foundItems)=>{
    
    if(foundItems.length === 0){
      Item.insertMany(defaultItems,(err)=>{
        if(err){
          console.log(err);
        }else{
          console.log("Successfuly saved default items to database.");
        }
      });
      res.redirect("/");
    }else{
      res.render("list",{listTitle:"Today",newListItems:foundItems});  
    }
  })
   
});

app.get("/:customListName",(req,res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name:customListName},(err,foundList)=>{
    if(!err){
      if(!foundList){
        //create a new route
        const list = new List({
          name:customListName,
          items: defaultItems
        })

        list.save();
        res.redirect("/"+ customListName)

      }else {
      res.render("list",{listTitle:foundList.name,newListItems:foundList.items});  
      }
    }
  }) 
})


app.post("/",function(req,res){

  let itemName =req.body.newItem;
  let listName =req.body.button;

  const item = new Item({
    name: itemName
  });

  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName}, function(err,foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+ listName);
    })
  } 
})


app.post("/delete",function(req,res){

  const checkItemId = req.body.checkBox.trim();
  const listName = req.body.listName.trim();

  if(listName === "Today"){
    Item.findByIdAndRemove(checkItemId,(err)=>{
      if(err){
        console.log(err);
      }else{
        console.log("successfully deleted the item.");
        res.redirect("/");
      }
    });
  }
  else{
    List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkItemId}}},(err,foundList)=>{
      if(!err){
        console.log("item deleted");
        console.log(foundList);
        res.redirect("/"+ listName);
      }
    })
  }

})

app.get("/about",(req,res) => {
  res.render("list");
})

let port =  process.env.PORT;
if(port == null || port == ""){
  port = 3000;
}


app.listen(port,function(){
  console.log("Server has started successfully");
})
