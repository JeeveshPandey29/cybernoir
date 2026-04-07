from __future__ import annotations

import html
import shutil
import zipfile
from pathlib import Path


SOURCE = Path(r"D:\Downloads\CLOUD SECURITY AND PRIVACY LAB 07.docx")
OUTPUT = Path(r"D:\project cybernoir\CLOUD SECURITY AND PRIVACY LAB 07 - IAM Lab 2.docx")
WORK_TEMP = Path(r"D:\project cybernoir\.docx_tmp")

SECT_PR = (
    '<w:sectPr w:rsidR="005B461A" w:rsidSect="007219F5">'
    '<w:pgSz w:w="11906" w:h="16838" w:code="9"/>'
    '<w:pgMar w:top="851" w:right="851" w:bottom="851" w:left="1418" w:header="709" w:footer="709" w:gutter="0"/>'
    '<w:cols w:space="708"/>'
    '<w:docGrid w:linePitch="360"/>'
    "</w:sectPr>"
)

DOC_NS = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" '
    'xmlns:cx="http://schemas.microsoft.com/office/drawing/2014/chartex" '
    'xmlns:cx1="http://schemas.microsoft.com/office/drawing/2015/9/8/chartex" '
    'xmlns:cx2="http://schemas.microsoft.com/office/drawing/2015/10/21/chartex" '
    'xmlns:cx3="http://schemas.microsoft.com/office/drawing/2016/5/9/chartex" '
    'xmlns:cx4="http://schemas.microsoft.com/office/drawing/2016/5/10/chartex" '
    'xmlns:cx5="http://schemas.microsoft.com/office/drawing/2016/5/11/chartex" '
    'xmlns:cx6="http://schemas.microsoft.com/office/drawing/2016/5/12/chartex" '
    'xmlns:cx7="http://schemas.microsoft.com/office/drawing/2016/5/13/chartex" '
    'xmlns:cx8="http://schemas.microsoft.com/office/drawing/2016/5/14/chartex" '
    'xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" '
    'xmlns:aink="http://schemas.microsoft.com/office/drawing/2016/ink" '
    'xmlns:am3d="http://schemas.microsoft.com/office/drawing/2017/model3d" '
    'xmlns:o="urn:schemas-microsoft-com:office:office" '
    'xmlns:oel="http://schemas.microsoft.com/office/2019/extlst" '
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
    'xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" '
    'xmlns:v="urn:schemas-microsoft-com:vml" '
    'xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" '
    'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" '
    'xmlns:w10="urn:schemas-microsoft-com:office:word" '
    'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" '
    'xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" '
    'xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml" '
    'xmlns:w16cex="http://schemas.microsoft.com/office/word/2018/wordml/cex" '
    'xmlns:w16cid="http://schemas.microsoft.com/office/word/2016/wordml/cid" '
    'xmlns:w16="http://schemas.microsoft.com/office/word/2018/wordml" '
    'xmlns:w16du="http://schemas.microsoft.com/office/word/2023/wordml/word16du" '
    'xmlns:w16sdtdh="http://schemas.microsoft.com/office/word/2020/wordml/sdtdatahash" '
    'xmlns:w16sdtfl="http://schemas.microsoft.com/office/word/2024/wordml/sdtformatlock" '
    'xmlns:w16se="http://schemas.microsoft.com/office/word/2015/wordml/symex" '
    'xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" '
    'xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" '
    'xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" '
    'xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" '
    'mc:Ignorable="w14 w15 w16se w16cid w16 w16cex w16sdtdh w16sdtfl w16du">'
)


CONTENT = [
    ("Cloud Security & Privacy Lab                                             23CSE3108", "title"),
    ("Name of the Student", "normal"),
    (": Jeevesh Pandey", "normal"),
    ("Division", "normal"),
    ("Batch", "normal"),
    (": TY - CSF 01", "normal"),
    (": B", "normal"),
    ("Enrolment No.", "normal"),
    ("Roll No.", "normal"),
    (": ADT23SOCB0485", "normal"),
    (": 33", "normal"),
    ("Title:", "heading"),
    ('"Implementing Access Control Using IAM Users, Roles, and Policies"', "normal"),
    ("Aim", "heading"),
    (
        "To study AWS Identity and Access Management (IAM) and implement access control by creating IAM users, roles, and policies in the AWS Management Console.",
        "normal",
    ),
    ("Objectives", "heading"),
    ("1. To understand the importance of IAM in cloud security and privacy.", "normal"),
    ("2. To create IAM users and assign permissions using policies.", "normal"),
    ("3. To create an IAM role for AWS service access.", "normal"),
    ("4. To observe how access is allowed or denied based on permissions.", "normal"),
    ("5. To perform practical IAM configuration using the AWS console.", "normal"),
    ("Outcomes", "heading"),
    ("After completion of this lab, we will be able to:", "normal"),
    ("1. Create and manage IAM users in AWS.", "normal"),
    ("2. Attach policies to control access to AWS resources.", "normal"),
    ("3. Create and understand IAM roles.", "normal"),
    ("4. Apply least privilege access in a cloud environment.", "normal"),
    ("5. Explain the role of IAM in securing cloud resources.", "normal"),
    ("Theory", "heading"),
    ("THEORETICAL ASPECTS", "subheading"),
    (
        "AWS Identity and Access Management (IAM) is a service that helps control access to AWS resources securely. It allows administrators to create users, roles, and policies so that only authorized entities can access cloud services. IAM is an important part of cloud security because it controls authentication and authorization.",
        "normal",
    ),
    (
        "An IAM user represents a person who needs access to AWS. Permissions are granted using policies, which define what actions are allowed or denied. AWS provides managed policies, and custom policies can also be created according to the requirement of the organization or lab task.",
        "normal",
    ),
    (
        "An IAM role is an identity that can be assumed by trusted users or AWS services. Roles are useful because they provide temporary access and do not require permanent credentials. In cloud security, IAM supports the principle of least privilege by giving only the permissions needed to perform a task.",
        "normal",
    ),
    ("Implementations", "heading"),
    ("Task 1: Access the AWS Management Console", "subheading"),
    ("Step 1: At the top of the lab page, choose Start Lab and wait for the AWS environment to become ready.", "normal"),
    ("Step 2: Choose the AWS link to open the AWS Management Console.", "normal"),
    ("Step 3: In the search bar, type IAM and open the IAM console.", "normal"),
    ("Task 2: Create an IAM User", "subheading"),
    ("Step 4: In the IAM console, choose Users and then choose Create user.", "normal"),
    ("Step 5: Enter the user name as LabUser and provide console access if permitted.", "normal"),
    ("Step 6: Complete the user creation process and note the sign-in details.", "normal"),
    ("Task 3: Attach a Policy to the User", "subheading"),
    ("Step 7: Open the created user and choose Add permissions.", "normal"),
    ("Step 8: Attach an AWS managed policy such as AmazonS3ReadOnlyAccess.", "normal"),
    ("Step 9: Review the permission summary and save the changes.", "normal"),
    ("Task 4: Create an IAM Role", "subheading"),
    ("Step 10: In the IAM console, choose Roles and then choose Create role.", "normal"),
    ("Step 11: Select AWS service as the trusted entity and choose EC2.", "normal"),
    ("Step 12: Attach a suitable policy and create the role.", "normal"),
    ("Task 5: Verify Access Control", "subheading"),
    ("Step 13: Sign in using the created IAM user if allowed and observe the accessible services.", "normal"),
    ("Step 14: Try to access an unauthorized service and note the Access Denied message.", "normal"),
    ("Step 15: Return to IAM and review how the attached policy controls the allowed actions.", "normal"),
    ("Result", "heading"),
    (
        "Thus, access control was successfully implemented in AWS using IAM users, roles, and policies. The experiment showed how IAM provides secure and limited access to cloud resources.",
        "normal",
    ),
]


def para(text: str, style: str) -> str:
    escaped = html.escape(text)
    if style == "title":
        return (
            '<w:p><w:pPr><w:jc w:val="center"/></w:pPr>'
            '<w:r><w:rPr><w:b/><w:sz w:val="24"/></w:rPr>'
            f"<w:t xml:space=\"preserve\">{escaped}</w:t></w:r></w:p>"
        )
    if style == "heading":
        return (
            '<w:p><w:pPr><w:spacing w:before="120" w:after="60"/></w:pPr>'
            '<w:r><w:rPr><w:b/><w:sz w:val="24"/></w:rPr>'
            f"<w:t>{escaped}</w:t></w:r></w:p>"
        )
    if style == "subheading":
        return (
            '<w:p><w:pPr><w:spacing w:before="80" w:after="40"/></w:pPr>'
            '<w:r><w:rPr><w:b/></w:rPr>'
            f"<w:t>{escaped}</w:t></w:r></w:p>"
        )
    if style == "code":
        return (
            '<w:p><w:pPr><w:ind w:left="720"/><w:spacing w:after="80"/></w:pPr>'
            '<w:r><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:sz w:val="18"/></w:rPr>'
            f"<w:t xml:space=\"preserve\">{escaped}</w:t></w:r></w:p>"
        )
    return f'<w:p><w:r><w:t xml:space="preserve">{escaped}</w:t></w:r></w:p>'


def build_document() -> str:
    paragraphs = "".join(para(text, style) for text, style in CONTENT)
    return f"{DOC_NS}<w:body>{paragraphs}{SECT_PR}</w:body></w:document>"


def rewrite_docx(source: Path, output: Path) -> None:
    document_xml = build_document().encode("utf-8")
    WORK_TEMP.mkdir(exist_ok=True)
    temp_docx = WORK_TEMP / "updated.docx"
    with zipfile.ZipFile(source, "r") as src_zip, zipfile.ZipFile(temp_docx, "w") as dst_zip:
        for item in src_zip.infolist():
            data = document_xml if item.filename == "word/document.xml" else src_zip.read(item.filename)
            dst_zip.writestr(item, data)
    shutil.copy2(temp_docx, output)


if __name__ == "__main__":
    rewrite_docx(SOURCE, OUTPUT)
    print(f"Created: {OUTPUT}")
