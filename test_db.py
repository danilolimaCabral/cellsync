
import os
import mysql.connector
from mysql.connector import Error

def connect():
    try:
        # URL: mysql://root:kPmsrdOqERKFlhvaWXaWrSEApsAkczkC@switchback.proxy.rlwy.net:32656/railway
        connection = mysql.connector.connect(
            host='switchback.proxy.rlwy.net',
            port=32656,
            database='railway',
            user='root',
            password='kPmsrdOqERKFlhvaWXaWrSEApsAkczkC',
            connection_timeout=10
        )

        if connection.is_connected():
            print("Conexão bem sucedida!")
            cursor = connection.cursor()
            cursor.execute("SELECT id, name, subdomain, cnpj, status FROM tenants;")
            records = cursor.fetchall()
            
            print("\n--- CLIENTES CADASTRADOS ---")
            for row in records:
                print(f"ID: {row[0]} | Nome: {row[1]} | Subdomínio: {row[2]} | CNPJ: {row[3]} | Status: {row[4]}")
                
    except Error as e:
        print(f"Erro ao conectar: {e}")
    finally:
        if 'connection' in locals() and connection.is_connected():
            connection.close()
            print("\nConexão fechada.")

if __name__ == "__main__":
    connect()
