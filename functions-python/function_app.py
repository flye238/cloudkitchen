import azure.functions as func
import json
import logging
import os
from azure.cosmos import CosmosClient

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

def get_container():
    client = CosmosClient(
        url=os.environ["COSMOS_ENDPOINT"],
        credential=os.environ["COSMOS_KEY"]
    )
    db        = client.get_database_client(os.environ.get("COSMOS_DB_NAME", "kitchendb"))
    container = db.get_container_client(os.environ.get("COSMOS_CONTAINER_NAME", "recipes"))
    return container

@app.route(route="recipes", methods=["GET"])
def GetRecipes(req: func.HttpRequest) -> func.HttpResponse:
    logging.info("[GetRecipes] triggered")
    try:
        container = get_container()
        items = list(container.query_items(
            query="SELECT c.id, c.name, c.cuisine, c.prepTime, c.servings, c.description, c.imageUrl, c.ingredients FROM c",
            enable_cross_partition_query=True
        ))
        return func.HttpResponse(
            body=json.dumps(items),
            status_code=200,
            mimetype="application/json",
            headers={"Access-Control-Allow-Origin": "*"}
        )
    except Exception as e:
        logging.error(f"[GetRecipes] error: {e}")
        return func.HttpResponse(
            body=json.dumps({"error": "Failed to fetch recipes"}),
            status_code=500,
            mimetype="application/json"
        )

@app.route(route="mealplans", methods=["POST"])
def SaveMealPlan(req: func.HttpRequest) -> func.HttpResponse:
    logging.info("[SaveMealPlan] triggered")
    try:
        body          = req.get_json()
        recipes       = body.get("recipes", [])
        customer_email = body.get("customerEmail")
        week_of       = body.get("weekOf")

        if not recipes:
            return func.HttpResponse(
                body=json.dumps({"error": "Cookbook is empty"}),
                status_code=400,
                mimetype="application/json"
            )

        import psycopg2
        conn = psycopg2.connect(
            host=os.environ["POSTGRES_HOST"],
            database=os.environ.get("POSTGRES_DB", "kitchendb"),
            user=os.environ["POSTGRES_USER"],
            password=os.environ["POSTGRES_PASSWORD"],
            sslmode="require"
        )
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS meal_plans (
                id SERIAL PRIMARY KEY,
                recipes JSONB NOT NULL,
                customer_email VARCHAR(255),
                week_of DATE,
                status VARCHAR(50) DEFAULT 'saved',
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)
        cur.execute(
            "INSERT INTO meal_plans (recipes, customer_email, week_of) VALUES (%s, %s, %s) RETURNING id, created_at",
            (json.dumps(recipes), customer_email, week_of)
        )
        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        return func.HttpResponse(
            body=json.dumps({
                "message": "Meal plan saved!",
                "planId": row[0],
                "status": "saved",
                "savedAt": str(row[1])
            }),
            status_code=201,
            mimetype="application/json",
            headers={"Access-Control-Allow-Origin": "*"}
        )
    except Exception as e:
        logging.error(f"[SaveMealPlan] error: {e}")
        return func.HttpResponse(
            body=json.dumps({"error": "Failed to save meal plan"}),
            status_code=500,
            mimetype="application/json"
        )

@app.route(route="process-mealplan", methods=["POST"])
def ProcessMealPlan(req: func.HttpRequest) -> func.HttpResponse:
    logging.info("[ProcessMealPlan] triggered")
    try:
        body      = req.get_json()
        plan_id   = body.get("planId")
        recipes   = body.get("recipes", [])

        if not plan_id or not recipes:
            return func.HttpResponse(
                body=json.dumps({"error": "planId and recipes are required"}),
                status_code=400,
                mimetype="application/json"
            )

        container    = get_container()
        shopping_list = []

        for item in recipes:
            results = list(container.query_items(
                query="SELECT c.name, c.ingredients FROM c WHERE c.id = @id",
                parameters=[{"name": "@id", "value": item.get("recipeId")}],
                enable_cross_partition_query=True
            ))
            if results and results[0].get("ingredients"):
                shopping_list.append({
                    "recipe": results[0]["name"],
                    "ingredients": results[0]["ingredients"]
                })

        return func.HttpResponse(
            body=json.dumps({
                "message": f"Meal plan {plan_id} processed",
                "shoppingList": shopping_list
            }),
            status_code=200,
            mimetype="application/json",
            headers={"Access-Control-Allow-Origin": "*"}
        )
    except Exception as e:
        logging.error(f"[ProcessMealPlan] error: {e}")
        return func.HttpResponse(
            body=json.dumps({"error": "Failed to process meal plan"}),
            status_code=500,
            mimetype="application/json"
        )
