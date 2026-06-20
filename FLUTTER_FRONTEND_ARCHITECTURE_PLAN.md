# تقرير تخطيط واجهة Flutter الشامل
**التاريخ:** يونيو 2026  
**المشروع:** AUTO_Renew Garage Management System - Frontend  
**المنصات:** Web + Windows Desktop  
**التقنية:** Flutter + Dart

---

## 📋 ملخص تنفيذي

### الهدف
بناء واجهة SaaS Dashboard احترافية كاملة لمشروع AUTO_Renew Garage Management System، مع الالتزام الصارم بتوثيق الـ Backend وعدم استخدام أي بيانات مزيفة.

### التقنيات المستخدمة
- **Framework:** Flutter 3.24+
- **Language:** Dart 3.5+
- **State Management:** Riverpod 2.5+
- **Routing:** go_router 14.0+
- **Networking:** http 1.2+ + dio 5.4+
- **Storage:** flutter_secure_storage 9.0+ (Windows: win32_secure_store)
- **Real-time:** socket_io_client 2.0+
- **Charts:** fl_chart 0.66+
- **UI Components:**
  - flutter_svg 2.0+
  - shimmer 3.0+
  - cached_network_image 3.3+
  - flutter_markdown 0.6+
- **Forms:** flutter_form_builder 9.1+
- **Tables:** data_table_2 2.5+
- **Icons:** lucide_icons_flutter 0.1+ (أو cupertino_icons)

### المنصات المستهدفة
- **Web:** Chrome, Edge, Firefox, Safari
- **Windows:** Windows 10/11

---

## 🏗️ بنية المشروع (Project Structure)

```
lib/
├── main.dart
├── app.dart
│
├── core/
│   ├── config/
│   │   ├── app_config.dart
│   │   ├── env_config.dart
│   │   └── api_config.dart
│   │
│   ├── constants/
│   │   ├── app_constants.dart
│   │   ├── api_constants.dart
│   │   ├── storage_constants.dart
│   │   └── role_constants.dart
│   │
│   ├── theme/
│   │   ├── app_theme.dart
│   │   ├── light_theme.dart
│   │   ├── dark_theme.dart
│   │   ├── app_colors.dart
│   │   ├── app_text_styles.dart
│   │   └── app_spacing.dart
│   │
│   ├── networking/
│   │   ├── api_client.dart
│   │   ├── api_interceptor.dart
│   │   ├── api_response.dart
│   │   ├── api_error.dart
│   │   └── dio_client.dart
│   │
│   ├── storage/
│   │   ├── secure_storage_service.dart
│   │   ├── storage_service.dart
│   │   └── session_manager.dart
│   │
│   ├── socket/
│   │   ├── socket_service.dart
│   │   ├── socket_events.dart
│   │   └── socket_handlers.dart
│   │
│   ├── error/
│   │   ├── exceptions.dart
│   │   ├── failure.dart
│   │   └── error_handler.dart
│   │
│   ├── utils/
│   │   ├── date_utils.dart
│   │   ├── currency_utils.dart
│   │   ├── validation_utils.dart
│   │   ├── debounce.dart
│   │   └── formatters.dart
│   │
│   └── widgets/
│       ├── common/
│       │   ├── app_scaffold.dart
│       │   ├── app_card.dart
│       │   ├── app_button.dart
│       │   ├── app_text_field.dart
│       │   ├── app_dropdown.dart
│       │   ├── app_date_picker.dart
│       │   ├── app_switch.dart
│       │   └── app_checkbox.dart
│       │
│       ├── loading/
│       │   ├── shimmer_loading.dart
│       │   ├── page_loading.dart
│       │   └── button_loading.dart
│       │
│       ├── error/
│       │   ├── error_widget.dart
│       │   ├── empty_widget.dart
│       │   └── network_error_widget.dart
│       │
│       ├── data_table/
│       │   ├── app_data_table.dart
│       │   ├── paginated_data_table.dart
│       │   └── sortable_data_table.dart
│       │
│       └── layout/
│           ├── sidebar.dart
│           ├── top_app_bar.dart
│           ├── content_area.dart
│           └── responsive_layout.dart
│
├── features/
│   ├── auth/
│   │   ├── data/
│   │   │   ├── models/
│   │   │   │   ├── user_model.dart
│   │   │   │   ├── login_request.dart
│   │   │   │   ├── login_response.dart
│   │   │   │   ├── refresh_token_request.dart
│   │   │   │   └── refresh_token_response.dart
│   │   │   ├── repositories/
│   │   │   │   └── auth_repository.dart
│   │   │   └── datasources/
│   │   │       └── auth_remote_datasource.dart
│   │   │
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   ├── user.dart
│   │   │   │   └── auth_session.dart
│   │   │   └── usecases/
│   │   │       ├── login_usecase.dart
│   │   │       ├── logout_usecase.dart
│   │   │       ├── refresh_token_usecase.dart
│   │   │       └── get_profile_usecase.dart
│   │   │
│   │   └── presentation/
│   │       ├── providers/
│   │       │   ├── auth_provider.dart
│   │       │   └── auth_state.dart
│   │       ├── screens/
│   │       │   ├── login_screen.dart
│   │       │   └── loading_screen.dart
│   │       └── widgets/
│   │           ├── login_form.dart
│   │           └── remember_me_checkbox.dart
│   │
│   ├── customers/
│   │   ├── data/
│   │   │   ├── models/
│   │   │   │   ├── customer_model.dart
│   │   │   │   ├── create_customer_request.dart
│   │   │   │   ├── update_customer_request.dart
│   │   │   │   └── customer_list_response.dart
│   │   │   ├── repositories/
│   │   │   │   └── customer_repository.dart
│   │   │   └── datasources/
│   │   │       └── customer_remote_datasource.dart
│   │   │
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── customer.dart
│   │   │   └── usecases/
│   │   │       ├── get_customers_usecase.dart
│   │   │       ├── get_customer_by_id_usecase.dart
│   │   │       ├── create_customer_usecase.dart
│   │   │       ├── update_customer_usecase.dart
│   │   │       ├── delete_customer_usecase.dart
│   │   │       └── add_loyalty_points_usecase.dart
│   │   │
│   │   └── presentation/
│   │       ├── providers/
│   │       │   ├── customer_provider.dart
│   │       │   └── customer_state.dart
│   │       ├── screens/
│   │       │   ├── customer_list_screen.dart
│   │       │   ├── customer_detail_screen.dart
│   │       │   └── customer_form_screen.dart
│   │       └── widgets/
│   │           ├── customer_table.dart
│   │           ├── customer_card.dart
│   │           ├── customer_form.dart
│   │           └── customer_tabs.dart
│   │
│   ├── vehicles/
│   │   ├── data/
│   │   │   ├── models/
│   │   │   │   ├── vehicle_model.dart
│   │   │   │   ├── create_vehicle_request.dart
│   │   │   │   ├── update_vehicle_request.dart
│   │   │   │   └── vehicle_list_response.dart
│   │   │   ├── repositories/
│   │   │   │   └── vehicle_repository.dart
│   │   │   └── datasources/
│   │   │       └── vehicle_remote_datasource.dart
│   │   │
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── vehicle.dart
│   │   │   └── usecases/
│   │   │       ├── get_vehicles_usecase.dart
│   │   │       ├── get_vehicle_by_id_usecase.dart
│   │   │       ├── create_vehicle_usecase.dart
│   │   │       ├── update_vehicle_usecase.dart
│   │   │       ├── delete_vehicle_usecase.dart
│   │   │       └── get_vehicles_by_customer_usecase.dart
│   │   │
│   │   └── presentation/
│   │       ├── providers/
│   │       │   ├── vehicle_provider.dart
│   │       │   └── vehicle_state.dart
│   │       ├── screens/
│   │       │   ├── vehicle_list_screen.dart
│   │       │   ├── vehicle_detail_screen.dart
│   │       │   └── vehicle_form_screen.dart
│   │       └── widgets/
│   │           ├── vehicle_table.dart
│   │           ├── vehicle_card.dart
│   │           ├── vehicle_form.dart
│   │           └── vehicle_tabs.dart
│   │
│   ├── bookings/
│   │   ├── data/
│   │   │   ├── models/
│   │   │   │   ├── booking_model.dart
│   │   │   │   ├── create_booking_request.dart
│   │   │   │   ├── update_booking_request.dart
│   │   │   │   └── booking_list_response.dart
│   │   │   ├── repositories/
│   │   │   │   └── booking_repository.dart
│   │   │   └── datasources/
│   │   │       └── booking_remote_datasource.dart
│   │   │
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── booking.dart
│   │   │   └── usecases/
│   │   │       ├── get_bookings_usecase.dart
│   │   │       ├── get_booking_by_id_usecase.dart
│   │   │       ├── create_booking_usecase.dart
│   │   │       ├── update_booking_usecase.dart
│   │   │       ├── delete_booking_usecase.dart
│   │   │       └── get_booking_by_vehicle_usecase.dart
│   │   │
│   │   └── presentation/
│   │       ├── providers/
│   │       │   ├── booking_provider.dart
│   │       │   └── booking_state.dart
│   │       ├── screens/
│   │       │   ├── booking_list_screen.dart
│   │       │   ├── booking_detail_screen.dart
│   │       │   └── booking_form_screen.dart
│   │       └── widgets/
│   │           ├── booking_table.dart
│   │           ├── booking_card.dart
│   │           ├── booking_form.dart
│   │           ├── booking_timeline.dart
│   │           └── booking_status_badge.dart
│   │
│   ├── invoices/
│   │   ├── data/
│   │   │   ├── models/
│   │   │   │   ├── invoice_model.dart
│   │   │   │   ├── create_invoice_request.dart
│   │   │   │   ├── update_invoice_request.dart
│   │   │   └── invoice_list_response.dart
│   │   │   ├── repositories/
│   │   │   │   └── invoice_repository.dart
│   │   │   └── datasources/
│   │   │       └── invoice_remote_datasource.dart
│   │   │
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── invoice.dart
│   │   │   └── usecases/
│   │   │       ├── get_invoices_usecase.dart
│   │   │       ├── get_invoice_by_id_usecase.dart
│   │   │       ├── create_invoice_usecase.dart
│   │   │       ├── update_invoice_usecase.dart
│   │   │       └── get_invoice_by_booking_usecase.dart
│   │   │
│   │   └── presentation/
│   │       ├── providers/
│   │       │   ├── invoice_provider.dart
│   │       │   └── invoice_state.dart
│   │       ├── screens/
│   │       │   ├── invoice_list_screen.dart
│   │       │   ├── invoice_detail_screen.dart
│   │       │   └── invoice_form_screen.dart
│   │       └── widgets/
│   │           ├── invoice_table.dart
│   │           ├── invoice_card.dart
│   │           ├── invoice_form.dart
│   │           ├── invoice_items_table.dart
│   │           └── invoice_payments_table.dart
│   │
│   ├── payments/
│   │   ├── data/
│   │   │   ├── models/
│   │   │   │   ├── payment_model.dart
│   │   │   │   ├── create_payment_request.dart
│   │   │   │   └── payment_list_response.dart
│   │   │   ├── repositories/
│   │   │   │   └── payment_repository.dart
│   │   │   └── datasources/
│   │   │       └── payment_remote_datasource.dart
│   │   │
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── payment.dart
│   │   │   └── usecases/
│   │   │       ├── get_payments_usecase.dart
│   │   │       ├── get_payment_by_id_usecase.dart
│   │   │       ├── create_payment_usecase.dart
│   │   │       ├── update_payment_usecase.dart
│   │   │       └── delete_payment_usecase.dart
│   │   │
│   │   └── presentation/
│   │       ├── providers/
│   │       │   ├── payment_provider.dart
│   │       │   └── payment_state.dart
│   │       ├── screens/
│   │       │   ├── payment_list_screen.dart
│   │       │   └── payment_form_screen.dart
│   │       └── widgets/
│   │           ├── payment_table.dart
│   │           ├── payment_form.dart
│   │           └── payment_method_selector.dart
│   │
│   ├── inventory/
│   │   ├── data/
│   │   │   ├── models/
│   │   │   │   ├── part_model.dart
│   │   │   │   ├── supplier_model.dart
│   │   │   │   ├── purchase_order_model.dart
│   │   │   │   ├── grn_model.dart
│   │   │   │   └── inventory_transaction_model.dart
│   │   │   ├── repositories/
│   │   │   │   ├── part_repository.dart
│   │   │   │   ├── supplier_repository.dart
│   │   │   │   ├── purchase_order_repository.dart
│   │   │   │   └── grn_repository.dart
│   │   │   └── datasources/
│   │   │       ├── part_remote_datasource.dart
│   │   │       ├── supplier_remote_datasource.dart
│   │   │       ├── purchase_order_remote_datasource.dart
│   │   │       └── grn_remote_datasource.dart
│   │   │
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   ├── part.dart
│   │   │   │   ├── supplier.dart
│   │   │   │   ├── purchase_order.dart
│   │   │   │   └── grn.dart
│   │   │   └── usecases/
│   │   │       ├── get_parts_usecase.dart
│   │   │       ├── get_suppliers_usecase.dart
│   │   │       ├── get_purchase_orders_usecase.dart
│   │   │       ├── get_grns_usecase.dart
│   │   │       └── get_stock_movements_usecase.dart
│   │   │
│   │   └── presentation/
│   │       ├── providers/
│   │       │   ├── part_provider.dart
│   │       │   ├── supplier_provider.dart
│   │       │   ├── purchase_order_provider.dart
│   │       │   └── grn_provider.dart
│   │       ├── screens/
│   │       │   ├── part_list_screen.dart
│   │       │   ├── supplier_list_screen.dart
│   │       │   ├── purchase_order_list_screen.dart
│   │       │   └── grn_list_screen.dart
│   │       └── widgets/
│   │           ├── part_table.dart
│   │           ├── supplier_table.dart
│   │           ├── purchase_order_table.dart
│   │           └── grn_table.dart
│   │
│   ├── accounting/
│   │   ├── data/
│   │   │   ├── models/
│   │   │   │   ├── account_model.dart
│   │   │   │   ├── journal_entry_model.dart
│   │   │   │   ├── journal_line_model.dart
│   │   │   │   └── fiscal_period_model.dart
│   │   │   ├── repositories/
│   │   │   │   ├── account_repository.dart
│   │   │   │   ├── journal_entry_repository.dart
│   │   │   │   └── fiscal_period_repository.dart
│   │   │   └── datasources/
│   │   │       ├── account_remote_datasource.dart
│   │   │       ├── journal_entry_remote_datasource.dart
│   │   │       └── fiscal_period_remote_datasource.dart
│   │   │
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   ├── account.dart
│   │   │   │   ├── journal_entry.dart
│   │   │   │   └── fiscal_period.dart
│   │   │   └── usecases/
│   │   │       ├── get_accounts_tree_usecase.dart
│   │   │       ├── get_journal_entries_usecase.dart
│   │   │       ├── create_journal_entry_usecase.dart
│   │   │       ├── get_trial_balance_usecase.dart
│   │   │       ├── get_income_statement_usecase.dart
│   │   │       └── get_balance_sheet_usecase.dart
│   │   │
│   │   └── presentation/
│   │       ├── providers/
│   │       │   ├── account_provider.dart
│   │       │   ├── journal_entry_provider.dart
│   │       │   └── accounting_report_provider.dart
│   │       ├── screens/
│   │       │   ├── chart_of_accounts_screen.dart
│   │       │   ├── journal_entries_screen.dart
│   │       │   ├── trial_balance_screen.dart
│   │       │   ├── income_statement_screen.dart
│   │       │   └── balance_sheet_screen.dart
│   │       └── widgets/
│   │           ├── account_tree_view.dart
│   │           ├── journal_entry_table.dart
│   │           ├── journal_entry_form.dart
│   │           └── accounting_report_table.dart
│   │
│   ├── hr/
│   │   ├── data/
│   │   │   ├── models/
│   │   │   │   ├── employee_model.dart
│   │   │   │   ├── department_model.dart
│   │   │   │   ├── attendance_model.dart
│   │   │   │   ├── shift_model.dart
│   │   │   │   └── payroll_record_model.dart
│   │   │   ├── repositories/
│   │   │   │   ├── employee_repository.dart
│   │   │   │   ├── department_repository.dart
│   │   │   │   ├── attendance_repository.dart
│   │   │   │   └── payroll_repository.dart
│   │   │   └── datasources/
│   │   │       ├── employee_remote_datasource.dart
│   │   │       ├── department_remote_datasource.dart
│   │   │       ├── attendance_remote_datasource.dart
│   │   │       └── payroll_remote_datasource.dart
│   │   │
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   ├── employee.dart
│   │   │   │   ├── department.dart
│   │   │   │   ├── attendance.dart
│   │   │   │   └── payroll_record.dart
│   │   │   └── usecases/
│   │   │       ├── get_employees_usecase.dart
│   │   │       ├── get_departments_usecase.dart
│   │   │       ├── get_attendance_usecase.dart
│   │   │       ├── get_payroll_usecase.dart
│   │   │       └── create_attendance_usecase.dart
│   │   │
│   │   └── presentation/
│   │       ├── providers/
│   │       │   ├── employee_provider.dart
│   │       │   ├── department_provider.dart
│   │       │   ├── attendance_provider.dart
│   │       │   └── payroll_provider.dart
│   │       ├── screens/
│   │       │   ├── employee_list_screen.dart
│   │       │   ├── department_list_screen.dart
│   │       │   ├── attendance_screen.dart
│   │       │   └── payroll_screen.dart
│   │       └── widgets/
│   │           ├── employee_table.dart
│   │           ├── department_table.dart
│   │           ├── attendance_table.dart
│   │           └── payroll_table.dart
│   │
│   ├── memberships/
│   │   ├── data/
│   │   │   ├── models/
│   │   │   │   ├── membership_plan_model.dart
│   │   │   │   ├── customer_membership_model.dart
│   │   │   │   ├── loyalty_point_model.dart
│   │   │   │   ├── customer_wallet_model.dart
│   │   │   │   └── loyalty_reward_model.dart
│   │   │   ├── repositories/
│   │   │   │   ├── membership_plan_repository.dart
│   │   │   │   ├── customer_membership_repository.dart
│   │   │   │   ├── loyalty_point_repository.dart
│   │   │   │   └── customer_wallet_repository.dart
│   │   │   └── datasources/
│   │   │       ├── membership_plan_remote_datasource.dart
│   │   │       ├── customer_membership_remote_datasource.dart
│   │   │       ├── loyalty_point_remote_datasource.dart
│   │   │       └── customer_wallet_remote_datasource.dart
│   │   │
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   ├── membership_plan.dart
│   │   │   │   ├── customer_membership.dart
│   │   │   │   ├── loyalty_point.dart
│   │   │   │   └── customer_wallet.dart
│   │   │   └── usecases/
│   │   │       ├── get_membership_plans_usecase.dart
│   │   │       ├── get_customer_memberships_usecase.dart
│   │   │       ├── get_loyalty_points_usecase.dart
│   │   │   ├── get_customer_wallet_usecase.dart
│   │   │       ├── purchase_membership_usecase.dart
│   │   │       └── redeem_points_usecase.dart
│   │   │
│   │   └── presentation/
│   │       ├── providers/
│   │       │   ├── membership_plan_provider.dart
│   │       │   ├── customer_membership_provider.dart
│   │       │   ├── loyalty_point_provider.dart
│   │       │   └── customer_wallet_provider.dart
│   │       ├── screens/
│   │       │   ├── membership_plans_screen.dart
│   │       │   ├── customer_memberships_screen.dart
│   │       │   ├── loyalty_points_screen.dart
│   │       │   └── customer_wallet_screen.dart
│   │       └── widgets/
│   │           ├── membership_plan_card.dart
│   │           ├── loyalty_points_card.dart
│   │           └── wallet_balance_card.dart
│   │
│   ├── dashboard/
│   │   ├── data/
│   │   │   ├── models/
│   │   │   │   ├── dashboard_kpi_model.dart
│   │   │   │   ├── sales_analytics_model.dart
│   │   │   │   ├── booking_analytics_model.dart
│   │   │   │   └── recent_activity_model.dart
│   │   │   ├── repositories/
│   │   │   │   └── dashboard_repository.dart
│   │   │   └── datasources/
│   │   │       └── dashboard_remote_datasource.dart
│   │   │
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   ├── dashboard_kpi.dart
│   │   │   │   ├── sales_analytics.dart
│   │   │   │   └── recent_activity.dart
│   │   │   └── usecases/
│   │   │       ├── get_dashboard_kpi_usecase.dart
│   │   │       ├── get_sales_analytics_usecase.dart
│   │   │       ├── get_booking_analytics_usecase.dart
│   │   │       └── get_recent_activity_usecase.dart
│   │   │
│   │   └── presentation/
│   │       ├── providers/
│   │       │   ├── dashboard_provider.dart
│   │       │   └── dashboard_state.dart
│   │       ├── screens/
│   │       │   └── dashboard_screen.dart
│   │       └── widgets/
│   │           ├── kpi_card.dart
│   │           ├── sales_chart.dart
│   │           ├── booking_chart.dart
│   │           └── recent_activity_list.dart
│   │
│   ├── settings/
│   │   ├── data/
│   │   │   ├── models/
│   │   │   │   ├── company_settings_model.dart
│   │   │   │   ├── role_model.dart
│   │   │   │   ├── permission_model.dart
│   │   │   │   └── branch_model.dart
│   │   │   ├── repositories/
│   │   │   │   ├── settings_repository.dart
│   │   │   │   ├── role_repository.dart
│   │   │   │   └── branch_repository.dart
│   │   │   └── datasources/
│   │   │       ├── settings_remote_datasource.dart
│   │   │       ├── role_remote_datasource.dart
│   │   │       └── branch_remote_datasource.dart
│   │   │
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   ├── company_settings.dart
│   │   │   │   ├── role.dart
│   │   │   │   ├── permission.dart
│   │   │   │   └── branch.dart
│   │   │   └── usecases/
│   │   │       ├── get_settings_usecase.dart
│   │   │       ├── update_settings_usecase.dart
│   │   │       ├── get_roles_usecase.dart
│   │   │       ├── get_permissions_usecase.dart
│   │   │       └── get_branches_usecase.dart
│   │   │
│   │   └── presentation/
│   │       ├── providers/
│   │       │   ├── settings_provider.dart
│   │       │   ├── role_provider.dart
│   │       │   └── branch_provider.dart
│   │       ├── screens/
│   │       │   ├── company_settings_screen.dart
│   │       │   ├── roles_screen.dart
│   │       │   ├── permissions_screen.dart
│   │       │   └── branches_screen.dart
│   │       └── widgets/
│   │           ├── settings_form.dart
│   │           ├── role_form.dart
│   │           ├── permission_selector.dart
│   │           └── branch_form.dart
│   │
│   └── notifications/
│       ├── data/
│       │   ├── models/
│       │   │   └── notification_model.dart
│       │   ├── repositories/
│       │   │   └── notification_repository.dart
│       │   └── datasources/
│       │       └── notification_remote_datasource.dart
│       │
│       ├── domain/
│       │   ├── entities/
│       │   │   └── notification.dart
│       │   └── usecases/
│       │       ├── get_notifications_usecase.dart
│       │       └── mark_notification_read_usecase.dart
│       │
│       └── presentation/
│           ├── providers/
│           │   ├── notification_provider.dart
│           │   └── notification_state.dart
│           ├── screens/
│           │   └── notification_list_screen.dart
│           └── widgets/
│               ├── notification_item.dart
│               └── notification_badge.dart
│
└── routes/
    ├── app_router.dart
    └── route_guard.dart
```

---

## 📦 Dependencies (pubspec.yaml)

```yaml
name: auto_renew_admin
description: AUTO_Renew Garage Management System - Admin Dashboard
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.5.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter

  # State Management
  flutter_riverpod: ^2.5.0
  riverpod_annotation: ^2.3.0

  # Routing
  go_router: ^14.0.0

  # Networking
  http: ^1.2.0
  dio: ^5.4.0
  retrofit: ^4.0.0
  json_annotation: ^4.8.0

  # Storage
  flutter_secure_storage: ^9.0.0
  shared_preferences: ^2.2.0

  # Real-time
  socket_io_client: ^2.0.0

  # Charts
  fl_chart: ^0.66.0

  # UI Components
  flutter_svg: ^2.0.0
  shimmer: ^3.0.0
  cached_network_image: ^3.3.0
  flutter_markdown: ^0.6.0
  flutter_form_builder: ^9.1.0
  form_builder_validators: ^9.1.0
  data_table_2: ^2.5.0
  cupertino_icons: ^1.0.0

  # Utilities
  intl: ^0.18.0
  uuid: ^4.0.0
  freezed_annotation: ^2.4.0

  # Windows-specific
  win32_secure_store: ^1.0.0

dev_dependencies:
  flutter_test:
    sdk: flutter

  # Code Generation
  build_runner: ^2.4.0
  freezed: ^2.4.0
  json_serializable: ^6.7.0
  riverpod_generator: ^2.3.0
  riverpod_lint: ^2.3.0
  retrofit_generator: ^8.0.0

  # Linting
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true
```

---

## 🔌 طبقة Networking (API Client)

### API Response Format

```dart
class ApiResponse<T> {
  final bool success;
  final T? data;
  final ApiError? error;

  ApiResponse({
    required this.success,
    this.data,
    this.error,
  });

  factory ApiResponse.fromJson(Map<String, dynamic> json, T Function(dynamic) dataParser) {
    if (json['success'] == true) {
      return ApiResponse<T>(
        success: true,
        data: json['data'] != null ? dataParser(json['data']) : null,
      );
    } else {
      return ApiResponse<T>(
        success: false,
        error: ApiError.fromJson(json['error']),
      );
    }
  }
}

class ApiError {
  final String code;
  final String message;

  ApiError({
    required this.code,
    required this.message,
  });

  factory ApiError.fromJson(Map<String, dynamic> json) {
    return ApiError(
      code: json['code'] ?? 'UNKNOWN_ERROR',
      message: json['message'] ?? 'An unknown error occurred',
    );
  }
}
```

### API Client with Dio

```dart
class DioClient {
  late Dio _dio;
  final String baseUrl;
  final SecureStorageService _secureStorage;

  DioClient({
    required this.baseUrl,
    required SecureStorageService secureStorage,
  }) : _secureStorage = secureStorage {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
      },
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        // Add Authorization header
        final token = await _secureStorage.getAccessToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onResponse: (response, handler) {
        return handler.next(response);
      },
      onError: (error, handler) async {
        // Handle 401/403 - Refresh token
        if (error.response?.statusCode == 401 || error.response?.statusCode == 403) {
          try {
            final refreshed = await _refreshToken();
            if (refreshed) {
              // Retry the original request
              final token = await _secureStorage.getAccessToken();
              error.requestOptions.headers['Authorization'] = 'Bearer $token';
              final response = await _dio.fetch(error.requestOptions);
              return handler.resolve(response);
            }
          } catch (e) {
            // Refresh failed - logout
            await _secureStorage.clearAll();
            // Navigate to login
          }
        }
        return handler.next(error);
      },
    ));
  }

  Future<bool> _refreshToken() async {
    try {
      final refreshToken = await _secureStorage.getRefreshToken();
      if (refreshToken == null) return false;

      final response = await _dio.post(
        '/api/auth/refresh',
        data: {'refreshToken': refreshToken},
      );

      if (response.statusCode == 200) {
        final data = response.data['data'];
        await _secureStorage.saveAccessToken(data['accessToken']);
        await _secureStorage.saveRefreshToken(data['refreshToken']);
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  }

  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await _dio.get<T>(path, queryParameters: queryParameters, options: options);
  }

  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await _dio.post<T>(path, data: data, queryParameters: queryParameters, options: options);
  }

  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await _dio.put<T>(path, data: data, queryParameters: queryParameters, options: options);
  }

  Future<Response<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await _dio.delete<T>(path, data: data, queryParameters: queryParameters, options: options);
  }
}
```

---

## 🔐 طبقة Storage (Secure Storage)

### Secure Storage Service

```dart
class SecureStorageService {
  final FlutterSecureStorage _storage;

  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _userIdKey = 'user_id';
  static const _tenantIdKey = 'tenant_id';
  static const _roleKey = 'role';

  SecureStorageService() : _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
    ),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock,
    ),
  );

  Future<void> saveAccessToken(String token) async {
    await _storage.write(key: _accessTokenKey, value: token);
  }

  Future<String?> getAccessToken() async {
    return await _storage.read(key: _accessTokenKey);
  }

  Future<void> saveRefreshToken(String token) async {
    await _storage.write(key: _refreshTokenKey, value: token);
  }

  Future<String?> getRefreshToken() async {
    return await _storage.read(key: _refreshTokenKey);
  }

  Future<void> saveUserId(String userId) async {
    await _storage.write(key: _userIdKey, value: userId);
  }

  Future<String?> getUserId() async {
    return await _storage.read(key: _userIdKey);
  }

  Future<void> saveTenantId(String tenantId) async {
    await _storage.write(key: _tenantIdKey, value: tenantId);
  }

  Future<String?> getTenantId() async {
    return await _storage.read(key: _tenantIdKey);
  }

  Future<void> saveRole(String role) async {
    await _storage.write(key: _roleKey, value: role);
  }

  Future<String?> getRole() async {
    return await _storage.read(key: _roleKey);
  }

  Future<void> clearAll() async {
    await _storage.delete(key: _accessTokenKey);
    await _storage.delete(key: _refreshTokenKey);
    await _storage.delete(key: _userIdKey);
    await _storage.delete(key: _tenantIdKey);
    await _storage.delete(key: _roleKey);
  }

  Future<bool> isAuthenticated() async {
    final token = await getAccessToken();
    return token != null && token.isNotEmpty;
  }
}
```

---

## 🎨 Theme System (SaaS Modern Design)

### App Colors

```dart
class AppColors {
  // Primary Colors
  static const Color primary = Color(0xFF6366F1); // Indigo 500
  static const Color primaryDark = Color(0xFF4F46E5); // Indigo 600
  static const Color primaryLight = Color(0xFF818CF8); // Indigo 400

  // Secondary Colors
  static const Color secondary = Color(0xFF10B981); // Emerald 500
  static const Color secondaryDark = Color(0xFF059669); // Emerald 600
  static const Color secondaryLight = Color(0xFF34D399); // Emerald 400

  // Neutral Colors
  static const Color background = Color(0xFFF9FAFB); // Gray 50
  static const Color surface = Color(0xFFFFFFFF); // White
  static const Color surfaceVariant = Color(0xFFF3F4F6); // Gray 100

  // Text Colors
  static const Color textPrimary = Color(0xFF111827); // Gray 900
  static const Color textSecondary = Color(0xFF6B7280); // Gray 500
  static const Color textTertiary = Color(0xFF9CA3AF); // Gray 400

  // Border Colors
  static const Color border = Color(0xFFE5E7EB); // Gray 200
  static const Color borderLight = Color(0xFFF3F4F6); // Gray 100

  // Status Colors
  static const Color success = Color(0xFF10B981); // Emerald 500
  static const Color warning = Color(0xFFF59E0B); // Amber 500
  static const Color error = Color(0xFFEF4444); // Red 500
  static const Color info = Color(0xFF3B82F6); // Blue 500

  // Shadow Colors
  static const Color shadow = Color(0x1A000000); // Black with 10% opacity
}
```

### App Text Styles

```dart
class AppTextStyles {
  static const TextStyle h1 = TextStyle(
    fontSize: 32,
    fontWeight: FontWeight.w700,
    color: AppColors.textPrimary,
    height: 1.2,
  );

  static const TextStyle h2 = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.w600,
    color: AppColors.textPrimary,
    height: 1.3,
  );

  static const TextStyle h3 = TextStyle(
    fontSize: 20,
    fontWeight: FontWeight.w600,
    color: AppColors.textPrimary,
    height: 1.4,
  );

  static const TextStyle h4 = TextStyle(
    fontSize: 18,
    fontWeight: FontWeight.w600,
    color: AppColors.textPrimary,
    height: 1.4,
  );

  static const TextStyle bodyLarge = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w400,
    color: AppColors.textPrimary,
    height: 1.5,
  );

  static const TextStyle bodyMedium = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w400,
    color: AppColors.textPrimary,
    height: 1.5,
  );

  static const TextStyle bodySmall = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w400,
    color: AppColors.textSecondary,
    height: 1.5,
  );

  static const TextStyle labelLarge = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w500,
    color: AppColors.textPrimary,
    height: 1.4,
  );

  static const TextStyle labelMedium = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w500,
    color: AppColors.textSecondary,
    height: 1.4,
  );

  static const TextStyle labelSmall = TextStyle(
    fontSize: 10,
    fontWeight: FontWeight.w500,
    color: AppColors.textTertiary,
    height: 1.4,
  );
}
```

### App Spacing

```dart
class AppSpacing {
  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 16.0;
  static const double lg = 24.0;
  static const double xl = 32.0;
  static const double xxl = 48.0;
}
```

---

## 🧭 Routing (go_router)

### App Router

```dart
class AppRouter {
  static final router = GoRouter(
    initialLocation: '/login',
    redirect: (context, state) {
      final isAuthenticated = context.read(authProvider).isAuthenticated;
      final isLoginRoute = state.matchedLocation == '/login';

      if (!isAuthenticated && !isLoginRoute) {
        return '/login';
      }

      if (isAuthenticated && isLoginRoute) {
        return '/dashboard';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        name: 'login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/loading',
        name: 'loading',
        builder: (context, state) => const LoadingScreen(),
      ),
      GoRoute(
        path: '/',
        name: 'home',
        redirect: (context, state) => '/dashboard',
      ),
      ShellRoute(
        builder: (context, state, child) => AppScaffold(child: child),
        routes: [
          GoRoute(
            path: '/dashboard',
            name: 'dashboard',
            builder: (context, state) => const DashboardScreen(),
          ),
          GoRoute(
            path: '/customers',
            name: 'customers',
            builder: (context, state) => const CustomerListScreen(),
          ),
          GoRoute(
            path: '/customers/:id',
            name: 'customer_detail',
            builder: (context, state) {
              final id = state.pathParameters['id']!;
              return CustomerDetailScreen(customerId: id);
            },
          ),
          GoRoute(
            path: '/vehicles',
            name: 'vehicles',
            builder: (context, state) => const VehicleListScreen(),
          ),
          GoRoute(
            path: '/vehicles/:id',
            name: 'vehicle_detail',
            builder: (context, state) {
              final id = state.pathParameters['id']!;
              return VehicleDetailScreen(vehicleId: id);
            },
          ),
          GoRoute(
            path: '/bookings',
            name: 'bookings',
            builder: (context, state) => const BookingListScreen(),
          ),
          GoRoute(
            path: '/bookings/:id',
            name: 'booking_detail',
            builder: (context, state) {
              final id = state.pathParameters['id']!;
              return BookingDetailScreen(bookingId: id);
            },
          ),
          GoRoute(
            path: '/invoices',
            name: 'invoices',
            builder: (context, state) => const InvoiceListScreen(),
          ),
          GoRoute(
            path: '/invoices/:id',
            name: 'invoice_detail',
            builder: (context, state) {
              final id = state.pathParameters['id']!;
              return InvoiceDetailScreen(invoiceId: id);
            },
          ),
          GoRoute(
            path: '/inventory',
            name: 'inventory',
            builder: (context, state) => const PartListScreen(),
          ),
          GoRoute(
            path: '/accounting',
            name: 'accounting',
            builder: (context, state) => const ChartOfAccountsScreen(),
          ),
          GoRoute(
            path: '/hr',
            name: 'hr',
            builder: (context, state) => const EmployeeListScreen(),
          ),
          GoRoute(
            path: '/memberships',
            name: 'memberships',
            builder: (context, state) => const MembershipPlansScreen(),
          ),
          GoRoute(
            path: '/settings',
            name: 'settings',
            builder: (context, state) => const CompanySettingsScreen(),
          ),
        ],
      ),
    ],
  );
}
```

---

## 📊 RBAC System

### Role Constants

```dart
enum UserRole {
  OWNER,
  MANAGER,
  RECEPTIONIST,
  MECHANIC,
  ACCOUNTANT,
  HR_MANAGER,
  CASHIER,
  SALES,
}

class RoleConstants {
  static const Map<UserRole, String> roleNames = {
    UserRole.OWNER: 'Owner',
    UserRole.MANAGER: 'Manager',
    UserRole.RECEPTIONIST: 'Receptionist',
    UserRole.MECHANIC: 'Mechanic',
    UserRole.ACCOUNTANT: 'Accountant',
    UserRole.HR_MANAGER: 'HR Manager',
    UserRole.CASHIER: 'Cashier',
    UserRole.SALES: 'Sales',
  };

  static const Map<String, UserRole> stringToRole = {
    'OWNER': UserRole.OWNER,
    'MANAGER': UserRole.MANAGER,
    'RECEPTIONIST': UserRole.RECEPTIONIST,
    'MECHANIC': UserRole.MECHANIC,
    'ACCOUNTANT': UserRole.ACCOUNTANT,
    'HR_MANAGER': UserRole.HR_MANAGER,
    'CASHIER': UserRole.CASHIER,
    'SALES': UserRole.SALES,
  };
}
```

### Permission Constants

```dart
class PermissionConstants {
  static const String useAiAssistant = 'use_ai_assistant';
  static const String viewAnalytics = 'view_analytics';
  static const String viewAuditLogs = 'view_audit_logs';
  static const String manageRoles = 'manage_roles';
  static const String manageSettings = 'manage_settings';
  static const String manageBranches = 'manage_branches';
  static const String manageInventory = 'manage_inventory';
  static const String manageAccounting = 'manage_accounting';
  static const String manageCustomers = 'manage_customers';
  static const String manageBookings = 'manage_bookings';
  static const String manageInvoices = 'manage_invoices';
  static const String managePayments = 'manage_payments';
  static const String manageHr = 'manage_hr';
  static const String manageMemberships = 'manage_memberships';
}

class PermissionGuard {
  static bool hasPermission(UserRole role, String permission) {
    // OWNER has all permissions
    if (role == UserRole.OWNER) return true;

    // Define permissions per role
    final rolePermissions = {
      UserRole.MANAGER: [
        PermissionConstants.viewAnalytics,
        PermissionConstants.manageSettings,
        PermissionConstants.manageBranches,
        PermissionConstants.manageInventory,
        PermissionConstants.manageAccounting,
        PermissionConstants.manageCustomers,
        PermissionConstants.manageBookings,
        PermissionConstants.manageInvoices,
        PermissionConstants.managePayments,
        PermissionConstants.manageHr,
        PermissionConstants.manageMemberships,
      ],
      UserRole.RECEPTIONIST: [
        PermissionConstants.manageCustomers,
        PermissionConstants.manageBookings,
      ],
      UserRole.MECHANIC: [
        PermissionConstants.manageBookings,
      ],
      UserRole.ACCOUNTANT: [
        PermissionConstants.manageAccounting,
        PermissionConstants.manageInvoices,
        PermissionConstants.managePayments,
      ],
      UserRole.HR_MANAGER: [
        PermissionConstants.manageHr,
      ],
      UserRole.CASHIER: [
        PermissionConstants.managePayments,
      ],
      UserRole.SALES: [
        PermissionConstants.manageCustomers,
        PermissionConstants.manageBookings,
      ],
    };

    return rolePermissions[role]?.contains(permission) ?? false;
  }

  static bool canAccessRoute(UserRole role, String route) {
    // Define route access per role
    final routeAccess = {
      '/dashboard': [UserRole.OWNER, UserRole.MANAGER, UserRole.RECEPTIONIST, UserRole.MECHANIC, UserRole.ACCOUNTANT, UserRole.HR_MANAGER, UserRole.CASHIER, UserRole.SALES],
      '/customers': [UserRole.OWNER, UserRole.MANAGER, UserRole.RECEPTIONIST, UserRole.SALES],
      '/vehicles': [UserRole.OWNER, UserRole.MANAGER, UserRole.RECEPTIONIST, UserRole.MECHANIC],
      '/bookings': [UserRole.OWNER, UserRole.MANAGER, UserRole.RECEPTIONIST, UserRole.MECHANIC, UserRole.SALES],
      '/invoices': [UserRole.OWNER, UserRole.MANAGER, UserRole.ACCOUNTANT, UserRole.CASHIER],
      '/inventory': [UserRole.OWNER, UserRole.MANAGER],
      '/accounting': [UserRole.OWNER, UserRole.MANAGER, UserRole.ACCOUNTANT],
      '/hr': [UserRole.OWNER, UserRole.MANAGER, UserRole.HR_MANAGER],
      '/memberships': [UserRole.OWNER, UserRole.MANAGER],
      '/settings': [UserRole.OWNER, UserRole.MANAGER],
    };

    return routeAccess[route]?.contains(role) ?? false;
  }
}
```

---

## 📡 Socket.IO Integration

### Socket Service

```dart
class SocketService {
  late Socket _socket;
  final String baseUrl;
  final SecureStorageService _secureStorage;

  SocketService({
    required this.baseUrl,
    required SecureStorageService secureStorage,
  }) : _secureStorage = secureStorage;

  Future<void> connect() async {
    final token = await _secureStorage.getAccessToken();
    final tenantId = await _secureStorage.getTenantId();
    final userId = await _secureStorage.getUserId();

    _socket = io.io(
      baseUrl,
      OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({
            'token': token,
            'tenantId': tenantId,
            'userId': userId,
          })
          .build(),
    );

    _socket.connect();

    // Join tenant channel
    if (tenantId != null) {
      _socket.emit('join-tenant', tenantId);
    }

    // Join user channel
    if (userId != null) {
      _socket.emit('join-user', userId);
    }

    _setupEventListeners();
  }

  void _setupEventListeners() {
    _socket.on('booking-updated', (data) {
      // Handle booking update
      print('Booking updated: $data');
    });

    _socket.on('notification', (data) {
      // Handle notification
      print('Notification: $data');
    });

    _socket.on('connect', (_) {
      print('Socket connected');
    });

    _socket.on('disconnect', (_) {
      print('Socket disconnected');
    });

    _socket.on('error', (error) {
      print('Socket error: $error');
    });
  }

  void joinBooking(String token) {
    _socket.emit('join-booking', {'token': token});
  }

  void disconnect() {
    _socket.disconnect();
  }
}
```

---

## 🎯 الخطة التنفيذية

### المرحلة 1: الأساسيات (High Priority)
1. إنشاء بنية المشروع
2. إعداد Dependencies
3. بناء طبقة Networking
4. بناء طبقة Storage
5. بناء Theme System
6. بناء Layout الأساسي

### المرحلة 2: Auth & RBAC (High Priority)
7. بناء شاشة Login
8. بناء نظام Auth (JWT, Refresh Token)
9. بناء نظام RBAC
10. بناء Route Guards

### المرحلة 3: Core Modules (Medium Priority)
11. بناء Dashboard
12. بناء Customers Module
13. بناء Vehicles Module
14. بناء Bookings Module
15. بناء Invoices & Payments Module

### المرحلة 4: Advanced Modules (Medium Priority)
16. بناء Inventory Module
17. بناء Accounting Module
18. بناء HR Module
19. بناء Memberships & Loyalty Module
20. بناء Settings & RBAC Module

### المرحلة 5: التحسينات (Low Priority)
21. بناء Notifications System
22. بناء Skeletons/Shimmers
23. بناء Error Handling UI
24. بناء Pagination System
25. بناء Search & Filter System
26. بناء Page Transitions
27. بناء Loading Screen
28. تحسين الأداء

---

**تم إنشاء هذا التقرير في:** يونيو 2026  
**بواسطة:** Cascade AI Assistant  
**الإصدار:** 1.0
