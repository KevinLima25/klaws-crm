using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

var http = new HttpClient();
http.DefaultRequestHeaders.Add("X-N8N-API-KEY", "N8N_API_KEY_REMOVED");

// Build the workflow JSON
var body = new JsonObject
{
    ["name"] = "CRM Chat",
    ["versionId"] = "7d7cb01f-7c7d-4bcc-82ae-a0d79ed12af5",
    ["settings"] = new JsonObject
    {
        ["executionOrder"] = "v1",
        ["binaryMode"] = "separate",
        ["availableInMCP"] = false
    },
    ["pinData"] = new JsonObject(),
    ["nodes"] = new JsonArray
    {
        new JsonObject
        {
            ["id"] = "9c869329-7e85-409c-97a5-87a97b61ee28",
            ["name"] = "CRM Webhook",
            ["type"] = "n8n-nodes-base.webhook",
            ["typeVersion"] = 2,
            ["position"] = new JsonArray { 0, 300 },
            ["parameters"] = new JsonObject
            {
                ["path"] = "crm-chat",
                ["httpMethod"] = "POST",
                ["responseMode"] = "lastNode",
                ["responseData"] = "text",
                ["responseContent"] = "={{ $json.message }}",
                ["options"] = new JsonObject()
            }
        },
        new JsonObject
        {
            ["id"] = "603280c9-2828-4592-b231-d54dcfe8ab6a",
            ["name"] = "Format Response",
            ["type"] = "n8n-nodes-base.set",
            ["typeVersion"] = 3.4,
            ["position"] = new JsonArray { 250, 300 },
            ["parameters"] = new JsonObject
            {
                ["assignments"] = new JsonObject
                {
                    ["assignments"] = new JsonArray
                    {
                        new JsonObject
                        {
                            ["id"] = "9a2d335e-2e8d-4f6c-bcc2-31ac20884740",
                            ["name"] = "text",
                            ["value"] = "={{ $json.message }}",
                            ["type"] = "string"
                        }
                    }
                },
                ["options"] = new JsonObject()
            }
        }
    },
    ["connections"] = new JsonObject
    {
        ["CRM Webhook"] = new JsonObject
        {
            ["main"] = new JsonArray
            {
                new JsonArray
                {
                    new JsonObject
                    {
                        ["node"] = "Format Response",
                        ["type"] = "main",
                        ["index"] = 0
                    }
                }
            }
        }
    }
};

var json = body.ToJsonString(new JsonSerializerOptions { WriteIndented = true });
Console.WriteLine(json);

// First deactivate
var deactResp = http.PostAsync("http://localhost:5678/api/v1/workflows/CRMchWEBHOOK123/deactivate", null).Result;
Console.WriteLine($"Deactivate: {deactResp.StatusCode}");

// Update
var content = new StringContent(json, Encoding.UTF8, "application/json");
var updateResp = http.PutAsync("http://localhost:5678/api/v1/workflows/CRMchWEBHOOK123", content).Result;
Console.WriteLine($"Update: {updateResp.StatusCode}");
Console.WriteLine(updateResp.Content.ReadAsStringAsync().Result);

// Activate
Thread.Sleep(2000);
var actResp = http.PostAsync("http://localhost:5678/api/v1/workflows/CRMchWEBHOOK123/activate", null).Result;
Console.WriteLine($"Activate: {actResp.StatusCode}");
