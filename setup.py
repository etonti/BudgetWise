from setuptools import setup, find_packages

setup(
    name="budgetwise",
    version="0.1",
    packages=find_packages(),
    install_requires=[
        'flask>=3.0.0',
        'flask-cors>=4.0.0',
    ],
)