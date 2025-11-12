#!/bin/bash

# Fix BookService tests - add libraryId to BookFormValue objects
sed -i '' 's/const formValue = {$/const formValue: Partial<BookFormValue> = {/g' src/app/core/services/book.service.spec.ts

# Fix PurchaseRequestService tests - rename requestedBy to userId
sed -i '' 's/requestedBy:/userId:/g' src/app/core/services/purchase-request.service.spec.ts

# Fix PurchaseRequestService tests - remove publisher field
sed -i '' '/publisher: /d' src/app/core/services/purchase-request.service.spec.ts

echo "Test fixes applied successfully"
