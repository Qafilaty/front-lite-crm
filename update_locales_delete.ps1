
$locales = @{
    "ar.json" = @{
        "users" = @{
            "modal" = @{
                "delete_title" = "حذف المستخدم"
                "delete_desc" = "هل أنت متأكد من أنك تريد حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء."
            }
        }
        "orders" = @{
            "assign_confirmer" = @{
                "toast_success" = "تم إسناد الطلبات بنجاح"
                "toast_error" = "فشل إسناد الطلبات"
                "title" = "إسناد الطلبات"
                "select_user" = "اختر الموظف (Confirmer)"
                "confirm_btn" = "تأكيد الإسناد"
                "no_users" = "لا يوجد موظفين بصلاحية Confirmed"
            }
        }
    }
    "fr.json" = @{
        "users" = @{
            "modal" = @{
                "delete_title" = "Supprimer l'utilisateur"
                "delete_desc" = "Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible."
            }
        }
        "orders" = @{
            "assign_confirmer" = @{
                "toast_success" = "Ordres assignés avec succès"
                "toast_error" = "Échec de l'assignation des ordres"
                "title" = "Assigner les ordres"
                "select_user" = "Sélectionnez l'employé (Confirmer)"
                "confirm_btn" = "Confirmer l'assignation"
                "no_users" = "Aucun employé avec la permission Confirmed"
            }
        }
    }
    "en.json" = @{
        "users" = @{
            "modal" = @{
                "delete_title" = "Delete User"
                "delete_desc" = "Are you sure you want to delete this user? This action cannot be undone."
            }
        }
        "orders" = @{
            "assign_confirmer" = @{
                "toast_success" = "Orders assigned successfully"
                "toast_error" = "Failed to assign orders"
                "title" = "Assign Orders"
                "select_user" = "Select Employee (Confirmer)"
                "confirm_btn" = "Confirm Assignment"
                "no_users" = "No employees with Confirmed permission"
            }
        }
    }
}

foreach ($file in $locales.Keys) {
    $filePath = "f:\CLIENTS_PROJECTS\lite-crm\front\locales\$file"
    if (Test-Path $filePath) {
        $jsonStr = Get-Content $filePath -Raw -Encoding UTF8
        # Simple string manipulation since ConvertFrom-Json modifies order and loses comments.
        # But for users: we need to find "modal": { 
        # Actually proper JS script is safer
    }
}

